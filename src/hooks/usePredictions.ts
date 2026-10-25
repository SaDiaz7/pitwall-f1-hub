import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSession } from "@/hooks/useSession";
import type { ActionResult } from "@/lib/wallpapers";

export type RaceEvent = Database["public"]["Tables"]["race_events"]["Row"];
export type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"];

export function usePredictions(season: number) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [events, setEvents] = useState<Record<number, RaceEvent>>({});
  const [predictions, setPredictions] = useState<Record<number, PredictionRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setEvents({});
      setPredictions({});
      setLoading(false);
      return;
    }

    const [eventsResult, predictionsResult] = await Promise.all([
      supabase.from("race_events").select("*").eq("season", season),
      supabase.from("predictions").select("*").eq("season", season),
    ]);

    if (eventsResult.error || predictionsResult.error) {
      console.error("Cargar predicciones:", eventsResult.error ?? predictionsResult.error);
      setError("No pudimos cargar las predicciones.");
    } else {
      setError(null);
      setEvents(Object.fromEntries((eventsResult.data ?? []).map((event) => [event.round, event])));
      setPredictions(Object.fromEntries((predictionsResult.data ?? []).map((row) => [row.round, row])));
    }
    setLoading(false);
  }, [userId, season]);

  useEffect(() => {
    if (sessionLoading) return;
    load();
  }, [sessionLoading, load]);

  // Guarda la predicción: si ya existía la actualiza, y si no, la crea.
  const savePrediction = useCallback(
    async (round: number, picks: string[]): Promise<ActionResult> => {
      if (!userId) return { ok: false, message: "Tenés que iniciar sesión." };

      const closedMessage = "Las predicciones de esta carrera ya cerraron o todavía no están habilitadas.";

      const { data: updated, error: updateError } = await supabase
        .from("predictions")
        .update({ picks, updated_at: new Date().toISOString() })
        .eq("season", season)
        .eq("round", round)
        .select("round");

      if (updateError) {
        console.error("Actualizar predicción:", updateError);
        return { ok: false, message: updateError.code === "42501" ? closedMessage : "No pudimos guardar tu predicción." };
      }

      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase.from("predictions").insert({ season, round, picks });

        if (insertError) {
          console.error("Crear predicción:", insertError);
          const blocked = insertError.code === "42501" || insertError.code === "23503";
          return { ok: false, message: blocked ? closedMessage : "No pudimos guardar tu predicción." };
        }
      }

      await load();
      return { ok: true };
    },
    [userId, season, load],
  );

  return { events, predictions, loading, error, savePrediction, reload: load };
}
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RaceEvent } from "@/hooks/usePredictions";
import { supabase } from "@/integrations/supabase/client";
import { getRaceResults, getSchedule } from "@/lib/f1";
import { predictionDeadline, raceStartOf, seasonOf } from "@/lib/predictions";
import type { GrandPrix } from "@/lib/types";

type Status = { type: "ok" | "error"; text: string } | null;

export function PredictionsAdmin() {
  const season = new Date().getFullYear();
  const [schedule, setSchedule] = useState<GrandPrix[]>([]);
  const [events, setEvents] = useState<Record<number, RaceEvent>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [syncing, setSyncing] = useState(false);
  const [busyRound, setBusyRound] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [races, eventsResult] = await Promise.all([
        getSchedule(),
        supabase.from("race_events").select("*").eq("season", season),
      ]);
      setSchedule(races);
      setEvents(Object.fromEntries((eventsResult.data ?? []).map((event) => [event.round, event])));
    } catch (error) {
      console.error("Cargar herramientas de predicciones:", error);
      setStatus({ type: "error", text: "No pudimos cargar el calendario." });
    }
    setLoading(false);
  }, [season]);

  useEffect(() => {
    load();
  }, [load]);

  // Copia el calendario a la base de datos (con la hora de cierre de cada carrera).
  const sync = async () => {
    setStatus(null);
    setSyncing(true);

    const rows = schedule.map((gp) => ({
      season: seasonOf(gp),
      round: gp.round,
      name: gp.name,
      qualifying_at: predictionDeadline(gp),
      race_at: raceStartOf(gp) ?? `${gp.date}T00:00:00Z`,
    }));

    const { error } = await supabase.from("race_events").upsert(rows, { onConflict: "season,round" });
    setSyncing(false);

    if (error) {
      console.error("Sincronizar calendario:", error);
      setStatus({ type: "error", text: "No pudimos sincronizar el calendario." });
      return;
    }

    await load();
    setStatus({ type: "ok", text: `Calendario sincronizado (${rows.length} carreras).` });
  };

  // Trae el resultado oficial y calcula los puntos de todas las predicciones de esa carrera.
  const score = async (gp: GrandPrix) => {
    setStatus(null);
    setBusyRound(gp.round);

    try {
      const results = await getRaceResults({ data: { round: gp.round } });
      const topTen = results
        .filter((r) => r.position >= 1 && r.position <= 10)
        .sort((a, b) => a.position - b.position)
        .map((r) => r.driverId);

      if (topTen.length !== 10) {
        setStatus({ type: "error", text: "La API todavía no tiene los 10 primeros de esa carrera." });
        return;
      }

      const { data, error } = await supabase.rpc("score_race", {
        p_season: seasonOf(gp),
        p_round: gp.round,
        p_results: topTen,
      });

      if (error) {
        console.error("Calcular puntos:", error);
        setStatus({ type: "error", text: "No pudimos calcular los puntos. Revisá la consola para ver el detalle." });
        return;
      }

      await load();
      setStatus({ type: "ok", text: `Puntos calculados para ${data ?? 0} predicciones de ${gp.name}.` });
    } catch (error) {
      console.error("Calcular puntos:", error);
      setStatus({ type: "error", text: "No pudimos traer el resultado de la carrera." });
    } finally {
      setBusyRound(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const finished = schedule.filter((gp) => gp.status === "finalizado");

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="text-xl font-bold uppercase">1. Habilitar carreras</h2>
        <p className="text-sm text-muted-foreground">
          Copia el calendario a la base de datos con la hora de cierre de cada carrera. Hacelo al principio de la
          temporada y cada vez que cambie una fecha. Sin esto, nadie puede predecir.
        </p>
        <p className="text-sm">
          Carreras habilitadas: <span className="font-bold">{Object.keys(events).length}</span> de {schedule.length}.
        </p>
        <Button type="button" disabled={syncing} onClick={sync} className="bg-gradient-primary font-semibold">
          {syncing ? "Sincronizando…" : "Sincronizar calendario"}
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="text-xl font-bold uppercase">2. Calcular puntos</h2>
        <p className="text-sm text-muted-foreground">
          Después de cada carrera, tocá el botón: trae el resultado oficial y reparte los puntos. Si el resultado se
          corrige, podés recalcular.
        </p>

        {finished.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no terminó ninguna carrera.</p>
        ) : (
          <ul className="space-y-2">
            {[...finished].reverse().map((gp) => {
              const event = events[gp.round];
              return (
                <li key={gp.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{gp.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {!event ? "No habilitada" : event.scored_at ? "Puntos calculados" : "Pendiente de calcular"}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!event || busyRound === gp.round}
                    onClick={() => score(gp)}
                  >
                    {busyRound === gp.round ? "Calculando…" : event?.scored_at ? "Recalcular" : "Calcular puntos"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {status && (
        <p
          className={
            status.type === "ok"
              ? "rounded-md bg-success/15 p-2 text-sm text-success"
              : "rounded-md bg-destructive/15 p-2 text-sm text-destructive"
          }
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import type { DgDriverOption, DgGame, DgSubmitResult } from "@/lib/dg";

const KNOWN_ERRORS = [
  "Ya terminaste el juego de hoy",
  "Ya probaste con ese piloto",
  "Piloto inválido",
  "Necesitás iniciar sesión",
  "Faltan pilotos para armar el juego",
];

export type DgSubmitResponse = { ok: true; result: DgSubmitResult } | { ok: false; message: string };

// withDrivers = false evita pedir la lista de pilotos cuando solo hace falta el estado (por ejemplo en Inicio).
export function useGuessDriver({ withDrivers = true }: { withDrivers?: boolean } = {}) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [game, setGame] = useState<DgGame | null>(null);
  const [drivers, setDrivers] = useState<DgDriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("dg_get_game");
    if (rpcError) {
      console.error("Cargar Adiviná el piloto:", rpcError);
      setError("No pudimos cargar el juego de hoy.");
      setLoading(false);
      return;
    }
    setGame(data as unknown as DgGame);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setGame(null);
      setLoading(false);
      return;
    }
    void load();
  }, [sessionLoading, userId, load]);

  useEffect(() => {
    if (!withDrivers || sessionLoading || !userId) return;
    let cancelled = false;

    supabase.rpc("dg_list_drivers").then(({ data, error: rpcError }) => {
      if (cancelled) return;
      if (rpcError) {
        console.error("Lista de pilotos:", rpcError);
        return;
      }
      setDrivers((data ?? []) as unknown as DgDriverOption[]);
    });

    return () => {
      cancelled = true;
    };
  }, [withDrivers, sessionLoading, userId]);

  const submit = useCallback(
    async (driverId: string): Promise<DgSubmitResponse> => {
      const { data, error: rpcError } = await supabase.rpc("dg_submit", { p_guess: driverId });

      if (rpcError) {
        console.error("Enviar intento:", rpcError);
        const known = KNOWN_ERRORS.find((text) => rpcError.message.includes(text));
        // Si quedó desfasado (por ejemplo, dos pestañas abiertas), se vuelve a cargar el estado.
        void load();
        return { ok: false, message: known ?? "No pudimos validar tu intento. Probá de nuevo." };
      }

      const result = data as unknown as DgSubmitResult;
      setGame((previous) =>
        previous
          ? {
              ...previous,
              guesses: [...previous.guesses, result.feedback],
              solved: result.solved,
              finished: result.finished,
              answer: result.answer,
            }
          : previous,
      );

      // Al terminar se vuelve a pedir el estado para traer la racha actualizada.
      if (result.finished) void load();

      return { ok: true, result };
    },
    [load],
  );

  return { game, drivers, loading, error, isGuest: !userId, submit };
}
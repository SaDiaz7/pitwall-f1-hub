import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { HlGame, HlPick, HlRound, HlSubmitResult } from "@/lib/higher-lower";

const KNOWN_ERRORS = ["Ya terminaste el juego de hoy", "Duelo fuera de orden", "Necesitás iniciar sesión"];

export type HlSubmitResponse = { ok: true; result: HlSubmitResult } | { ok: false; message: string };

export function useHigherLower() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [game, setGame] = useState<HlGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("hl_get_game");
    if (rpcError) {
      console.error("Cargar ¿Más o menos?:", rpcError);
      setError("No pudimos cargar el juego de hoy.");
      setLoading(false);
      return;
    }
    setGame(data as unknown as HlGame);
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

  // Manda la respuesta. El juego no avanza hasta que se llama a advance().
  const submit = useCallback(
    async (round: number, pick: HlPick): Promise<HlSubmitResponse> => {
      const { data, error: rpcError } = await supabase.rpc("hl_submit", { p_round: round, p_pick: pick });

      if (rpcError) {
        console.error("Enviar duelo:", rpcError);
        const known = KNOWN_ERRORS.find((text) => rpcError.message.includes(text));
        // Si quedó desfasado (por ejemplo, dos pestañas abiertas), se vuelve a cargar el estado.
        void load();
        return { ok: false, message: known ?? "No pudimos validar tu respuesta. Probá de nuevo." };
      }

      return { ok: true, result: data as unknown as HlSubmitResult };
    },
    [load],
  );

  // Pasa al duelo siguiente con lo que devolvió el servidor.
  const advance = useCallback(
    (pick: HlPick, result: HlSubmitResult) => {
      setGame((previous) => {
        if (!previous || !previous.current) return previous;
        const played: HlRound = {
          round: previous.current.round,
          stat: result.stat,
          a_name: previous.current.a_name,
          a_value: result.a_value,
          b_name: previous.current.b_name,
          b_value: result.b_value,
          pick,
          correct: result.correct,
        };
        return {
          ...previous,
          score: result.score,
          finished: result.finished,
          rounds: [...previous.rounds, played],
          current: result.next,
        };
      });

      // Al terminar se vuelve a pedir el estado para traer la racha actualizada.
      if (result.finished) void load();
    },
    [load],
  );

  return { game, loading, error, isGuest: !userId, submit, advance };
}
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { ActionResult } from "@/lib/wallpapers";
import { readGuestGame, writeGuestGame, type Clues, type GameCircuit, type GameState } from "@/lib/daily-game";

interface PuzzleRow {
  puzzle_date: string;
  puzzle_path: string;
  max_attempts: number;
  my_guesses: string[] | null;
  is_finished: boolean;
  is_solved: boolean;
  clues: Clues | null;
  answer_id: string | null;
  streak: number;
}

interface GuessRow {
  is_correct: boolean;
  is_finished: boolean;
  attempts_used: number;
  clues: Clues | null;
  answer_id: string | null;
  streak: number;
}

export function useDailyGame() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [state, setState] = useState<GameState | null>(null);
  const [circuits, setCircuits] = useState<GameCircuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [puzzleRes, listRes] = await Promise.all([
      supabase.rpc("game_get_puzzle"),
      supabase.rpc("game_circuit_list"),
    ]);

    const row = ((puzzleRes.data ?? []) as unknown as PuzzleRow[])[0];

    if (puzzleRes.error || listRes.error || !row) {
      console.error("Cargar juego diario:", puzzleRes.error ?? listRes.error);
      setError("No pudimos cargar el juego de hoy.");
      setLoading(false);
      return;
    }

    let next: GameState = {
      date: row.puzzle_date,
      path: row.puzzle_path,
      maxAttempts: row.max_attempts,
      guesses: row.my_guesses ?? [],
      finished: row.is_finished,
      solved: row.is_solved,
      clues: row.clues ?? {},
      answerId: row.answer_id,
      streak: row.streak,
    };

    // Visitante: el progreso viene del navegador.
    if (!userId) {
      const saved = readGuestGame(row.puzzle_date);
      if (saved) {
        next = {
          ...next,
          guesses: saved.guesses,
          finished: saved.finished,
          solved: saved.solved,
          clues: saved.clues,
          answerId: saved.answerId,
        };
      }
    }

    setCircuits((listRes.data ?? []) as unknown as GameCircuit[]);
    setState(next);
    setError(null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (sessionLoading) return;
    load();
  }, [sessionLoading, load]);

  const submit = useCallback(
    async (circuitId: string): Promise<ActionResult> => {
      if (!state) return { ok: false, message: "El juego todavía no cargó." };
      if (state.finished) return { ok: false, message: "Ya terminaste el juego de hoy." };
      if (state.guesses.includes(circuitId)) return { ok: false, message: "Ya probaste ese circuito." };

      const { data, error: rpcError } = await supabase.rpc("game_submit_guess", {
        p_guess: circuitId,
        // Mientras el juego no termina, todos los intentos previos fueron errores.
        p_prior_misses: state.guesses.length,
      });

      const row = ((data ?? []) as unknown as GuessRow[])[0];
      if (rpcError || !row) {
        console.error("Enviar intento:", rpcError);
        return { ok: false, message: "No pudimos validar tu intento. Probá de nuevo." };
      }

      const next: GameState = {
        ...state,
        guesses: [...state.guesses, circuitId],
        finished: row.is_finished,
        solved: row.is_correct,
        clues: row.clues ?? {},
        answerId: row.answer_id,
        streak: userId ? row.streak : 0,
      };
      setState(next);

      if (!userId) {
        writeGuestGame({
          date: next.date,
          guesses: next.guesses,
          finished: next.finished,
          solved: next.solved,
          clues: next.clues,
          answerId: next.answerId,
        });
      }

      return { ok: true };
    },
    [state, userId],
  );

  return { state, circuits, loading, error, isGuest: !userId, submit };
}
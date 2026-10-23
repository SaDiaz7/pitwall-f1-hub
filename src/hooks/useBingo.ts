import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { BINGO_CELLS, type BingoCell } from "@/lib/bingo";
import type { ActionResult } from "@/lib/wallpapers";

const emptyCells = (): (BingoCell | null)[] => Array.from({ length: BINGO_CELLS }, () => null);

export function useBingo(season: number) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [cells, setCells] = useState<(BingoCell | null)[]>(emptyCells);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setCells(emptyCells());
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("bingo_cells")
      .select("position, text, marked")
      .eq("season", season);

    if (queryError) {
      console.error("Cargar bingo:", queryError);
      setError("No pudimos cargar tu bingo.");
    } else {
      setError(null);
      const next = emptyCells();
      for (const row of data ?? []) {
        if (row.position >= 0 && row.position < BINGO_CELLS) {
          next[row.position] = { text: row.text, marked: row.marked };
        }
      }
      setCells(next);
    }
    setLoading(false);
  }, [userId, season]);

  useEffect(() => {
    if (sessionLoading) return;
    load();
  }, [sessionLoading, load]);

  // Guarda los textos. Solo escribe lo que cambió, así las casillas sin cambios conservan su marca.
  const saveCard = useCallback(
    async (texts: string[]): Promise<ActionResult> => {
      if (!userId) return { ok: false, message: "Tenés que iniciar sesión." };

      const now = new Date().toISOString();
      const upserts: {
        user_id: string;
        season: number;
        position: number;
        text: string;
        marked: boolean;
        marked_at: null;
        updated_at: string;
      }[] = [];
      const removals: number[] = [];

      texts.slice(0, BINGO_CELLS).forEach((raw, position) => {
        const text = raw.trim();
        const previous = cells[position] ?? null;

        if (!text) {
          if (previous) removals.push(position);
          return;
        }
        if (previous && previous.text === text) return;

        upserts.push({ user_id: userId, season, position, text, marked: false, marked_at: null, updated_at: now });
      });

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase
          .from("bingo_cells")
          .upsert(upserts, { onConflict: "user_id,season,position" });
        if (upsertError) {
          console.error("Guardar bingo:", upsertError);
          return { ok: false, message: "No pudimos guardar tu bingo. Revisá la consola para ver el detalle." };
        }
      }

      if (removals.length > 0) {
        const { error: deleteError } = await supabase
          .from("bingo_cells")
          .delete()
          .eq("user_id", userId)
          .eq("season", season)
          .in("position", removals);
        if (deleteError) {
          console.error("Borrar casillas:", deleteError);
          return { ok: false, message: "No pudimos borrar algunas casillas." };
        }
      }

      await load();
      return { ok: true };
    },
    [userId, season, cells, load],
  );

  // Tacha o destacha una casilla (se refleja al instante y se confirma con la base).
  const toggle = useCallback(
    async (position: number): Promise<ActionResult> => {
      const cell = cells[position];
      if (!userId || !cell) return { ok: false, message: "Esa casilla está vacía." };

      const marked = !cell.marked;
      const setMarked = (value: boolean) =>
        setCells((prev) => prev.map((c, i) => (i === position && c ? { ...c, marked: value } : c)));

      setMarked(marked);

      const { error: updateError } = await supabase
        .from("bingo_cells")
        .update({ marked, marked_at: marked ? new Date().toISOString() : null })
        .eq("user_id", userId)
        .eq("season", season)
        .eq("position", position);

      if (updateError) {
        console.error("Tachar casilla:", updateError);
        setMarked(!marked); // vuelve atrás
        return { ok: false, message: "No pudimos guardar el cambio. Probá de nuevo." };
      }

      return { ok: true };
    },
    [cells, userId, season],
  );

  return { cells, loading, error, saveCard, toggle };
}
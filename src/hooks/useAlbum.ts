import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { KIND_ORDER, RARITY_RANK, type AlbumEntry, type CardKind, type Rarity } from "@/lib/album";

export function useAlbum() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [entries, setEntries] = useState<AlbumEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("album_get_collection");
    if (rpcError) {
      console.error("Cargar álbum:", rpcError);
      setError("No pudimos cargar tu álbum.");
      setLoading(false);
      return;
    }

    const rows = (data ?? []).map((row) => ({
      card_id: row.card_id,
      kind: row.kind as CardKind,
      name: row.name,
      subtitle: row.subtitle,
      rarity: row.rarity as Rarity,
      stats: (row.stats ?? {}) as unknown as Record<string, unknown>,
      quantity: row.quantity,
      foil_quantity: row.foil_quantity,
    }));

    // Orden: por tipo, de más rara a más común, y por nombre. El número es la posición dentro de cada tipo.
    rows.sort(
      (a, b) =>
        KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
        RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] ||
        a.name.localeCompare(b.name, "es"),
    );

    const counters: Record<CardKind, number> = { driver: 0, team: 0, circuit: 0 };
    setEntries(rows.map((row) => ({ ...row, number: ++counters[row.kind] })));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionLoading || !userId) return;
    void reload();
  }, [sessionLoading, userId, reload]);

  return { entries, loading, error, reload };
}
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import type { AlbumCard } from "@/lib/album";
import type { Collection } from "@/lib/collections";

const KNOWN_ERRORS = [
  "La colección no está disponible",
  "Ya reclamaste esta recompensa",
  "Todavía no completaste la colección",
  "Necesitás iniciar sesión",
];

export type ClaimResponse = { ok: true; cards: AlbumCard[] } | { ok: false; message: string };

export function useCollections() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("album_get_collections");
    if (rpcError) {
      console.error("Cargar colecciones:", rpcError);
      setError("No pudimos cargar las colecciones.");
      setLoading(false);
      return;
    }
    setCollections((data ?? []) as unknown as Collection[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    void reload();
  }, [sessionLoading, userId, reload]);

  const claim = useCallback(
    async (collectionId: string): Promise<ClaimResponse> => {
      const { data, error: rpcError } = await supabase.rpc("album_claim_collection", { p_collection: collectionId });

      if (rpcError) {
        console.error("Reclamar colección:", rpcError);
        const known = KNOWN_ERRORS.find((text) => rpcError.message.includes(text));
        void reload();
        return { ok: false, message: known ?? "No pudimos reclamar la recompensa. Probá de nuevo." };
      }

      const payload = data as unknown as { cards?: AlbumCard[] };
      await reload();
      return { ok: true, cards: payload.cards ?? [] };
    },
    [reload],
  );

  return { collections, loading, error, claim, reload };
}
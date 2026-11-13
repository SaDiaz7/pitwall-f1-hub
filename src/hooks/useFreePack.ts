import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import type { AlbumCard } from "@/lib/album";

export type FreePackStatus = "available" | "claimed";

interface PackPayload {
  status?: FreePackStatus;
  cards?: AlbumCard[];
}

const KNOWN_ERRORS = ["Ya reclamaste tu sobre gratis de hoy", "Todavía no hay cartas disponibles"];

export function useFreePack() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [status, setStatus] = useState<FreePackStatus | null>(null);
  const [cards, setCards] = useState<AlbumCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("album_free_pack_today");
    if (rpcError) {
      console.error("Estado del sobre gratis:", rpcError);
      return;
    }
    const payload = data as unknown as PackPayload;
    setStatus(payload.status ?? "available");
    setCards(payload.cards ?? []);
  }, []);

  useEffect(() => {
    if (sessionLoading || !userId) return;
    void refresh();
  }, [sessionLoading, userId, refresh]);

  // Devuelve true si el sobre se abrió bien.
  const open = useCallback(async (): Promise<boolean> => {
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("album_open_free_pack");
    if (rpcError) {
      console.error("Abrir sobre gratis:", rpcError);
      setError(
        KNOWN_ERRORS.find((known) => rpcError.message.includes(known)) ?? "No pudimos abrir el sobre. Probá de nuevo.",
      );
      await refresh();
      return false;
    }

    const payload = data as unknown as PackPayload;
    setCards(payload.cards ?? []);
    setStatus("claimed");
    return true;
  }, [refresh]);

  return { sessionLoading, isGuest: !userId, status, cards, error, open };
}
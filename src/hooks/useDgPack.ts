import { useCallback, useEffect, useState } from "react";
import type { PackStatus } from "@/hooks/useDailyPack";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import type { AlbumCard } from "@/lib/album";

interface PackPayload {
  status?: PackStatus;
  cards?: AlbumCard[];
}

const KNOWN_ERRORS = [
  "Ya abriste tu sobre de hoy",
  "Terminá el juego de hoy para abrir tu sobre",
  "Todavía no hay cartas disponibles",
];

export function useDgPack(refreshKey: number) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [status, setStatus] = useState<PackStatus | null>(null);
  const [cards, setCards] = useState<AlbumCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("dg_today_pack");
    if (rpcError) {
      console.error("Estado del sobre de Adiviná el piloto:", rpcError);
      return;
    }
    const payload = data as unknown as PackPayload;
    setStatus(payload.status ?? "not_ready");
    setCards(payload.cards ?? []);
  }, []);

  // Se vuelve a consultar cuando termina el juego (refreshKey cambia).
  useEffect(() => {
    if (sessionLoading || !userId) return;
    void refresh();
  }, [sessionLoading, userId, refresh, refreshKey]);

  // Devuelve true si el sobre se abrió bien.
  const open = useCallback(async (): Promise<boolean> => {
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("dg_open_pack");
    if (rpcError) {
      console.error("Abrir sobre de Adiviná el piloto:", rpcError);
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

  return { isGuest: !userId, status, cards, error, open };
}
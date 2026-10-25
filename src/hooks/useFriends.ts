import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// relation: "friends" (amigo), "received" (te pidió amistad) o "sent" (se la pediste).
export interface FriendRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  relation: string;
}

export interface FriendResult {
  ok: boolean;
  message: string;
}

const SEND_RESULTS: Record<string, FriendResult> = {
  sent: { ok: true, message: "Pedido enviado." },
  accepted: { ok: true, message: "¡Ya son amigos!" },
  already_friends: { ok: true, message: "Ya son amigos." },
  already_pending: { ok: true, message: "Ya le enviaste un pedido a esta persona." },
  limit: { ok: false, message: "Tenés demasiados pedidos pendientes. Esperá a que respondan alguno." },
  unavailable: { ok: false, message: "No pudimos enviar el pedido a esa persona." },
};

const GENERIC_ERROR: FriendResult = { ok: false, message: "No pudimos completar la acción. Probá de nuevo." };

export function useFriends() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [rows, setRows] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("get_friends");

    if (rpcError) {
      console.error("Cargar amigos:", rpcError);
      setError("No pudimos cargar tus amigos.");
    } else {
      setError(null);
      setRows(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (sessionLoading) return;
    load();
  }, [sessionLoading, load]);

  const sendRequest = useCallback(
    async (targetId: string): Promise<FriendResult> => {
      const { data, error: rpcError } = await supabase.rpc("send_friend_request", { p_user_id: targetId });
      if (rpcError) {
        console.error("Enviar pedido:", rpcError);
        return GENERIC_ERROR;
      }
      await load();
      return SEND_RESULTS[data] ?? GENERIC_ERROR;
    },
    [load],
  );

  const respond = useCallback(
    async (requesterId: string, accept: boolean): Promise<FriendResult> => {
      const { error: rpcError } = await supabase.rpc("respond_friend_request", {
        p_requester_id: requesterId,
        p_accept: accept,
      });
      if (rpcError) {
        console.error("Responder pedido:", rpcError);
        return GENERIC_ERROR;
      }
      await load();
      return { ok: true, message: accept ? "¡Ya son amigos!" : "Pedido rechazado." };
    },
    [load],
  );

  const remove = useCallback(
    async (targetId: string): Promise<FriendResult> => {
      const { error: rpcError } = await supabase.rpc("remove_friend", { p_user_id: targetId });
      if (rpcError) {
        console.error("Quitar amigo:", rpcError);
        return GENERIC_ERROR;
      }
      await load();
      return { ok: true, message: "Listo." };
    },
    [load],
  );

  return { rows, loading, error, sendRequest, respond, remove };
}
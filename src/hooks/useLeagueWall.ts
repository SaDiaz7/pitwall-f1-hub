import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WALL_PAGE, wallError, type ReactionMap, type WallPost } from "@/lib/league-wall";
import type { ActionResult } from "@/lib/wallpapers";

const POLL_MS = 20_000;

export function useLeagueWall(leagueId: string) {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evita mandar dos veces la misma reacción si se toca rápido.
  const pending = useRef(new Set<string>());

  const fetchPage = useCallback(
    async (before: string | null): Promise<WallPost[] | null> => {
      const { data, error: rpcError } = await supabase.rpc("get_league_wall", {
        p_league_id: leagueId,
        p_limit: WALL_PAGE,
        ...(before ? { p_before: before } : {}),
      });
      if (rpcError) {
        console.error("Cargar el muro:", rpcError);
        return null;
      }
      return (data ?? []).map((row) => ({
        ...row,
        reactions: (row.reactions ?? {}) as unknown as ReactionMap,
      }));
    },
    [leagueId],
  );

  // Trae los mensajes más nuevos y conserva los más viejos que ya estaban cargados.
  const refresh = useCallback(async () => {
    const fresh = await fetchPage(null);
    if (fresh === null) return;
    setError(null);
    setPosts((previous) => {
      const oldest = fresh[fresh.length - 1]?.created_at;
      const older = oldest ? previous.filter((p) => Date.parse(p.created_at) < Date.parse(oldest)) : [];
      return [...fresh, ...older];
    });
  }, [fetchPage]);

  // Primera carga y actualización automática mientras la pestaña está a la vista.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchPage(null).then((fresh) => {
      if (cancelled) return;
      if (fresh === null) {
        setError("No pudimos cargar el muro.");
      } else {
        setPosts(fresh);
        setHasMore(fresh.length === WALL_PAGE);
        setError(null);
      }
      setLoading(false);
    });

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [fetchPage, refresh]);

  const loadMore = useCallback(async () => {
    const last = posts[posts.length - 1];
    if (!last) return;

    const more = await fetchPage(last.created_at);
    if (more === null) {
      setError("No pudimos cargar más mensajes.");
      return;
    }
    setPosts((previous) => {
      const known = new Set(previous.map((p) => p.post_id));
      return [...previous, ...more.filter((p) => !known.has(p.post_id))];
    });
    setHasMore(more.length === WALL_PAGE);
  }, [fetchPage, posts]);

  const post = useCallback(
    async (body: string): Promise<ActionResult> => {
      const { error: rpcError } = await supabase.rpc("post_to_league", { p_league_id: leagueId, p_body: body });
      if (rpcError) {
        console.error("Publicar en el muro:", rpcError);
        return { ok: false, message: wallError(rpcError, "No pudimos publicar el mensaje.") };
      }
      await refresh();
      return { ok: true };
    },
    [leagueId, refresh],
  );

  const remove = useCallback(
    async (postId: string) => {
      // Se saca de la pantalla al instante y después se confirma con la base.
      setPosts((previous) => previous.filter((p) => p.post_id !== postId));
      const { error: rpcError } = await supabase.rpc("delete_league_post", { p_post_id: postId });
      if (rpcError) {
        console.error("Borrar mensaje:", rpcError);
        setError("No pudimos borrar el mensaje.");
        await refresh();
      }
    },
    [refresh],
  );

  const react = useCallback(
    async (postId: string, emoji: string) => {
      const key = `${postId}:${emoji}`;
      if (pending.current.has(key)) return;
      pending.current.add(key);

      // Actualización optimista: la pantalla cambia al instante.
      setPosts((previous) =>
        previous.map((p) => {
          if (p.post_id !== postId) return p;
          const current = p.reactions[emoji];
          const mine = current?.mine ?? false;
          const count = Math.max(0, (current?.count ?? 0) + (mine ? -1 : 1));
          const reactions = { ...p.reactions };
          if (count === 0) delete reactions[emoji];
          else reactions[emoji] = { count, mine: !mine };
          return { ...p, reactions };
        }),
      );

      const { error: rpcError } = await supabase.rpc("toggle_post_reaction", { p_post_id: postId, p_emoji: emoji });
      pending.current.delete(key);

      if (rpcError) {
        console.error("Reaccionar:", rpcError);
        setError("No pudimos guardar tu reacción.");
        await refresh();
      }
    },
    [refresh],
  );

  return { posts, loading, hasMore, error, loadMore, post, remove, react };
}
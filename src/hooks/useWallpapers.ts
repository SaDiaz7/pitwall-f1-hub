import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Wallpaper } from "@/lib/wallpapers";

export function useWallpapers() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evita que un doble clic rápido mande dos escrituras para el mismo fondo.
  const pending = useRef(new Set<string>());

  const reload = useCallback(async () => {
    if (!userId) {
      setWallpapers([]);
      setLikedIds(new Set());
      setLoading(false);
      return;
    }

    const [wallpapersResult, likesResult] = await Promise.all([
      supabase.from("wallpapers").select("*").order("created_at", { ascending: false }),
      supabase.from("wallpaper_likes").select("wallpaper_id"),
    ]);

    if (wallpapersResult.error) {
      setError("No pudimos cargar los fondos.");
    } else {
      setError(null);
      setWallpapers(wallpapersResult.data ?? []);
    }

    if (!likesResult.error) {
      setLikedIds(new Set((likesResult.data ?? []).map((row) => row.wallpaper_id)));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (sessionLoading) return;
    reload();
  }, [sessionLoading, reload]);

  // Marca o desmarca el like en pantalla (y ajusta el contador).
  const applyLike = useCallback((wallpaperId: string, liked: boolean) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(wallpaperId);
      else next.delete(wallpaperId);
      return next;
    });
    setWallpapers((prev) =>
      prev.map((w) =>
        w.id === wallpaperId
          ? { ...w, likes_count: Math.max(0, w.likes_count + (liked ? 1 : -1)) }
          : w,
      ),
    );
  }, []);

  const toggleLike = useCallback(
    async (wallpaperId: string) => {
      if (!userId || pending.current.has(wallpaperId)) return;
      pending.current.add(wallpaperId);

      const wasLiked = likedIds.has(wallpaperId);
      setError(null);

      // Actualización optimista: la pantalla cambia al instante...
      applyLike(wallpaperId, !wasLiked);

      // ...y después confirmamos con la base de datos.
      const { error: writeError } = wasLiked
        ? await supabase
            .from("wallpaper_likes")
            .delete()
            .eq("user_id", userId)
            .eq("wallpaper_id", wallpaperId)
        : await supabase.from("wallpaper_likes").insert({ wallpaper_id: wallpaperId });

      if (writeError) {
        // Si falló, volvemos atrás el cambio.
        applyLike(wallpaperId, wasLiked);
        setError("No pudimos guardar tu like. Probá de nuevo.");
      }

      pending.current.delete(wallpaperId);
    },
    [applyLike, likedIds, userId],
  );

  return { wallpapers, likedIds, loading, error, reload, toggleLike };
}

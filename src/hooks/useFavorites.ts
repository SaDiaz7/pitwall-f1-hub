import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export function useFavorites() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga los favoritos del usuario logueado.
  useEffect(() => {
    if (sessionLoading) return;

    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from("favorite_drivers")
        .select("driver_id")
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (queryError) {
        setError("No pudimos cargar tus favoritos.");
      } else {
        setFavorites((data ?? []).map((row) => row.driver_id));
      }
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, sessionLoading]);

  // Agrega o quita un piloto de favoritos.
  const toggle = useCallback(
    async (driverId: string) => {
      if (!userId) return;

      const wasFavorite = favorites.includes(driverId);
      setError(null);

      // Actualización optimista: la pantalla cambia al instante...
      setFavorites((prev) =>
        wasFavorite ? prev.filter((id) => id !== driverId) : [...prev, driverId],
      );

      // ...y después confirmamos con la base de datos.
      const { error: writeError } = wasFavorite
        ? await supabase
            .from("favorite_drivers")
            .delete()
            .eq("user_id", userId)
            .eq("driver_id", driverId)
        : await supabase.from("favorite_drivers").insert({ driver_id: driverId });

      if (writeError) {
        // Si falló, volvemos atrás el cambio.
        setFavorites((prev) =>
          wasFavorite ? [...prev, driverId] : prev.filter((id) => id !== driverId),
        );
        setError("No pudimos guardar el cambio. Probá de nuevo.");
      }
    },
    [favorites, userId],
  );

  const isFavorite = useCallback((driverId: string) => favorites.includes(driverId), [favorites]);

  return { favorites, loading, error, isFavorite, toggle };
}

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export function useFavoriteTeams() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga los equipos favoritos del usuario logueado.
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
        .from("favorite_constructors")
        .select("constructor_id")
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (queryError) {
        console.error("Cargar equipos favoritos:", queryError);
        setError("No pudimos cargar tus equipos favoritos.");
      } else {
        setFavorites((data ?? []).map((row) => row.constructor_id));
      }
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, sessionLoading]);

  // Agrega o quita un equipo de favoritos.
  const toggle = useCallback(
    async (teamId: string) => {
      if (!userId) return;

      const wasFavorite = favorites.includes(teamId);
      setError(null);

      // Actualización optimista: la pantalla cambia al instante...
      setFavorites((prev) => (wasFavorite ? prev.filter((id) => id !== teamId) : [...prev, teamId]));

      // ...y después confirmamos con la base de datos.
      const { error: writeError } = wasFavorite
        ? await supabase.from("favorite_constructors").delete().eq("user_id", userId).eq("constructor_id", teamId)
        : await supabase.from("favorite_constructors").insert({ constructor_id: teamId });

      if (writeError) {
        console.error("Guardar equipo favorito:", writeError);
        // Si falló, volvemos atrás el cambio.
        setFavorites((prev) => (wasFavorite ? [...prev, teamId] : prev.filter((id) => id !== teamId)));
        setError("No pudimos guardar el cambio. Probá de nuevo.");
      }
    },
    [favorites, userId],
  );

  const isFavorite = useCallback((teamId: string) => favorites.includes(teamId), [favorites]);

  return { favorites, loading, error, isFavorite, toggle };
}
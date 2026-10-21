import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Wallpaper } from "@/lib/wallpapers";

export function useWallpapers() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setWallpapers([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("wallpapers")
      .select("*")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError("No pudimos cargar los fondos.");
    } else {
      setError(null);
      setWallpapers(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (sessionLoading) return;
    reload();
  }, [sessionLoading, reload]);

  return { wallpapers, loading, error, reload };
}
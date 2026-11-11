import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WallpaperUploader {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export const uploaderName = (uploader: WallpaperUploader) =>
  uploader.display_name || uploader.username || "Sin nombre";

// Datos públicos de quienes subieron fondos, indexados por el id del usuario.
export function useWallpaperUploaders() {
  const [uploaders, setUploaders] = useState<Map<string, WallpaperUploader>>(new Map());

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_wallpaper_uploaders");
    if (error) {
      console.error("Cargar autores de fondos:", error);
      return;
    }
    setUploaders(new Map((data ?? []).map((row) => [row.user_id, row])));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { uploaders, reload };
}
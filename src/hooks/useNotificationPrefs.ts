import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export type PrefKey =
  | "friend_request"
  | "new_wallpaper"
  | "points_scored"
  | "driver_result"
  | "prediction_reminder"
  | "daily_game";

export type Prefs = Record<PrefKey, boolean>;

const DEFAULT_PREFS: Prefs = {
  friend_request: true,
  new_wallpaper: true,
  points_scored: true,
  driver_result: true,
  prediction_reminder: true,
  daily_game: true,
};

export function useNotificationPrefs() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId as string)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Cargar preferencias de notificaciones:", error);
      } else if (data) {
        setPrefs({
          friend_request: data.friend_request,
          new_wallpaper: data.new_wallpaper,
          points_scored: data.points_scored,
          driver_result: data.driver_result,
          prediction_reminder: data.prediction_reminder,
          daily_game: data.daily_game,
        });
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, sessionLoading]);

  const update = useCallback(
    async (key: PrefKey, value: boolean): Promise<boolean> => {
      if (!userId) return false;

      setPrefs((current) => ({ ...current, [key]: value }));

      const change = { [key]: value } as Partial<Prefs>;
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: userId, ...change, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

      if (error) {
        console.error("Guardar preferencia de notificación:", error);
        setPrefs((current) => ({ ...current, [key]: !value })); // vuelve atrás
        return false;
      }
      return true;
    },
    [userId],
  );

  return { prefs, loading, update };
}
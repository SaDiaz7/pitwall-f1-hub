import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import type { BadgeStats } from "@/lib/badges";
import type { BadgeStatsRow, WrappedData } from "@/lib/wrapped";

export function useWrapped() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [data, setData] = useState<WrappedData | null>(null);
  const [badgeStats, setBadgeStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const [wrappedRes, badgesRes] = await Promise.all([
        supabase.rpc("get_my_wrapped"),
        supabase.rpc("get_profile_badge_stats", { p_user_id: userId }),
      ]);
      if (cancelled) return;

      if (wrappedRes.error || !wrappedRes.data) {
        console.error("Mi temporada:", wrappedRes.error);
        setError("No pudimos armar tu resumen. Probá de nuevo en un rato.");
        setLoading(false);
        return;
      }

      const wrapped = wrappedRes.data as unknown as WrappedData;
      setData(wrapped);

      // Las insignias usan las mismas cuentas que tu perfil. Si fallan, esa lámina simplemente no aparece.
      const row = ((badgesRes.data ?? []) as unknown as BadgeStatsRow[])[0];
      if (badgesRes.error) {
        console.error("Insignias de Mi temporada:", badgesRes.error);
      } else if (row) {
        setBadgeStats({ ...row, album_owned: wrapped.album.distinct, album_foils: wrapped.album.foil });
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, sessionLoading]);

  return { data, badgeStats, loading, error };
}
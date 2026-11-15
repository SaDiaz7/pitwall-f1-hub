import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TodayInfo } from "@/lib/games";

// Qué juego toca hoy y cómo es la semana.
export function useTodayGame() {
  const [info, setInfo] = useState<TodayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc("game_today_info").then(({ data, error: rpcError }) => {
      if (cancelled) return;
      if (rpcError || !data) {
        console.error("Juego de hoy:", rpcError);
        setError(true);
      } else {
        setInfo(data as unknown as TodayInfo);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { info, loading, error };
}
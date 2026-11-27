import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

// Cómo va el juego de hoy para esta persona (sin cargar el juego entero).
export interface TodayProgress {
  game: string | null;
  started: boolean;
  finished: boolean;
  attempts: number;
  total: number;
}

export function useTodayProgress() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [progress, setProgress] = useState<TodayProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setProgress(null);
      setLoading(false);
      return;
    }
    let cancelled = false;

    supabase.rpc("game_today_progress").then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Progreso del día:", error);
      } else {
        setProgress(data as unknown as TodayProgress);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionLoading, userId]);

  return { progress, loading };
}
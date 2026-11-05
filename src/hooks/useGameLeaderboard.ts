import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

export interface GameLeaderboardRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  solved_days: number;
}

// Mismos puntos, mismo lugar.
export function computeGameRanks(rows: GameLeaderboardRow[]): number[] {
  const ranks: number[] = [];
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    ranks.push(previous && previous.total_points === row.total_points ? (ranks[index - 1] ?? index + 1) : index + 1);
  });
  return ranks;
}

// weekOffset: 0 = esta semana, -1 = la semana pasada.
export function useGameLeaderboard(weekOffset: number, refreshKey = 0) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [everyone, setEveryone] = useState<GameLeaderboardRow[]>([]);
  const [friends, setFriends] = useState<GameLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      const [all, mine] = await Promise.all([
        supabase.rpc("game_weekly_leaderboard", { p_week_offset: weekOffset }),
        supabase.rpc("game_weekly_friends_leaderboard", { p_week_offset: weekOffset }),
      ]);
      if (cancelled) return;

      if (all.error || mine.error) {
        console.error("Cargar ranking del juego:", all.error ?? mine.error);
        setError(true);
      } else {
        setEveryone((all.data ?? []) as unknown as GameLeaderboardRow[]);
        setFriends((mine.data ?? []) as unknown as GameLeaderboardRow[]);
        setError(false);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, userId, weekOffset, refreshKey]);

  return { userId, everyone, friends, loading, error };
}
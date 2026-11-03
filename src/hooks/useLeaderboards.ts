import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  scored_races: number;
}

// Mismos puntos, mismo lugar.
export function computeRanks(rows: LeaderboardRow[]): number[] {
  const ranks: number[] = [];
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    ranks.push(previous && previous.total_points === row.total_points ? (ranks[index - 1] ?? index + 1) : index + 1);
  });
  return ranks;
}

export function useLeaderboards(season: number) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [everyone, setEveryone] = useState<LeaderboardRow[]>([]);
  const [friends, setFriends] = useState<LeaderboardRow[]>([]);
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
        supabase.rpc("get_leaderboard", { p_season: season }),
        supabase.rpc("get_friends_leaderboard", { p_season: season }),
      ]);
      if (cancelled) return;

      if (all.error || mine.error) {
        console.error("Cargar ranking:", all.error ?? mine.error);
        setError(true);
      } else {
        setEveryone(all.data ?? []);
        setFriends(mine.data ?? []);
        setError(false);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, userId, season]);

  return { userId, everyone, friends, loading, error };
}
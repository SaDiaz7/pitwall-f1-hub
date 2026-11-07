import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import type { ActionResult } from "@/lib/wallpapers";

export type DotdStatus = "not_open" | "open" | "closed";

export interface DotdTally {
  driver_id: string;
  votes: number;
}

interface DotdRow {
  status: string;
  my_vote: string | null;
  total_votes: number | null;
  tally: DotdTally[] | null;
}

const VOTE_MESSAGES: Record<string, string> = {
  not_open: "La votación todavía no abrió.",
  closed: "La votación ya cerró.",
  invalid_driver: "Ese piloto no participó de la carrera.",
};

export function useDriverOfTheDay(season: number, round: number) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [status, setStatus] = useState<DotdStatus>("not_open");
  const [myVote, setMyVote] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [tally, setTally] = useState<DotdTally[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("dotd_get", { p_season: season, p_round: round });
    const row = ((data ?? []) as unknown as DotdRow[])[0];

    if (rpcError || !row) {
      console.error("Cargar piloto del día:", rpcError);
      setError("No pudimos cargar la votación.");
      setLoading(false);
      return;
    }

    setStatus(row.status === "open" || row.status === "closed" ? row.status : "not_open");
    setMyVote(row.my_vote);
    setTotalVotes(row.total_votes ?? 0);
    setTally(Array.isArray(row.tally) ? row.tally : []);
    setError(null);
    setLoading(false);
  }, [season, round]);

  useEffect(() => {
    if (sessionLoading) return;
    void load();
  }, [sessionLoading, userId, load]);

  const vote = useCallback(
    async (driverId: string): Promise<ActionResult> => {
      if (!userId) return { ok: false, message: "Tenés que iniciar sesión para votar." };

      const { data, error: rpcError } = await supabase.rpc("dotd_vote", {
        p_season: season,
        p_round: round,
        p_driver: driverId,
      });
      const row = ((data ?? []) as unknown as { result: string }[])[0];

      if (rpcError || !row) {
        console.error("Votar piloto del día:", rpcError);
        return { ok: false, message: "No pudimos registrar tu voto. Probá de nuevo." };
      }
      if (row.result !== "ok") {
        return { ok: false, message: VOTE_MESSAGES[row.result] ?? "No pudimos registrar tu voto." };
      }

      await load();
      return { ok: true };
    },
    [userId, season, round, load],
  );

  return { userId, status, myVote, totalVotes, tally, loading, error, vote };
}
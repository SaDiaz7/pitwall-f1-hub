import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TrophyArt, trophyName } from "@/components/trophies/TrophyArt";
import { supabase } from "@/integrations/supabase/client";

interface TrophyRow {
  trophy_id: string;
  league_name: string;
  season: number;
  total_points: number;
  member_count: number;
  awarded_at: string;
}

export function TrophyShowcase({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const [trophies, setTrophies] = useState<TrophyRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc("get_profile_trophies", { p_user_id: userId }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Cargar trofeos:", error);
        setTrophies([]);
        return;
      }
      setTrophies(data ?? []);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (trophies === null) return null;
  if (trophies.length === 0 && !isSelf) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border bg-card bg-[radial-gradient(ellipse_at_top,rgba(255,214,102,0.10),transparent_65%)]">
      <div className="px-5 pt-5">
        <h2 className="text-xl font-bold uppercase">Vitrina de trofeos</h2>
      </div>

      {trophies.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-sm text-muted-foreground">
          Tu vitrina está vacía. Ganá una{" "}
          <Link to="/ligas" className="font-semibold text-primary hover:underline">
            liga
          </Link>{" "}
          y la copa de la temporada va a quedar acá.
        </p>
      ) : (
        <ul className="flex gap-6 overflow-x-auto px-5 pb-4 pt-3">
          {trophies.map((trophy) => (
            <li key={trophy.trophy_id} className="w-36 shrink-0 text-center">
              <TrophyArt year={trophy.season} className="mx-auto w-36" />
              <p className="mt-1 font-display text-sm font-bold uppercase">{trophyName(trophy.season)}</p>
              <p className="truncate text-xs text-muted-foreground">{trophy.league_name}</p>
              <p className="text-xs text-muted-foreground">
                {trophy.total_points} pts · {trophy.member_count} miembros
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="h-3 border-t border-amber-400/30 bg-[linear-gradient(to_bottom,#2b2b32,#0b0b0e)]" />
    </section>
  );
}
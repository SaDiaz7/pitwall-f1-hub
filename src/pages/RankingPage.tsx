import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/hooks/useSession";
import { getInitials } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaderboardRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  scored_races: number;
}

export function RankingPage() {
  const season = new Date().getFullYear();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !userId) return;
    let cancelled = false;

    async function load() {
      const { data, error: rpcError } = await supabase.rpc("get_leaderboard", { p_season: season });
      if (cancelled) return;

      if (rpcError) {
        console.error("Cargar ranking:", rpcError);
        setError("No pudimos cargar el ranking.");
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, userId, season]);

  // Mismos puntos, mismo lugar.
  const ranks: number[] = [];
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    ranks.push(previous && previous.total_points === row.total_points ? (ranks[index - 1] ?? index + 1) : index + 1);
  });

  const myIndex = rows.findIndex((row) => row.user_id === userId);

  return (
    <>
      <PageHeader title="Ranking" subtitle={`Puntos de predicciones de la temporada ${season}.`} />

      {error && <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando el ranking…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay nadie en el ranking.
        </div>
      ) : (
        <>
          {myIndex !== -1 ? (
            <p className="mb-4 text-sm">
              Estás en el puesto <span className="font-bold">{ranks[myIndex]}</span> de {rows.length}.
            </p>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">
              No aparecés en el ranking. Para aparecer necesitás un nombre de usuario (Ajustes → Perfil) y tener
              activada la visibilidad en Ajustes → Privacidad.
            </p>
          )}

          <ol className="space-y-2">
            {rows.map((row, index) => {
              const mine = row.user_id === userId;
              const name = row.display_name || row.username || "Sin nombre";

              return (
                <li
                  key={row.user_id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-card p-3",
                    mine && "border-primary/60",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-base font-bold",
                      ranks[index] === 1 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
                    )}
                  >
                    {ranks[index]}
                  </span>
                  <Avatar className="h-10 w-10">
                    {row.avatar_url && <AvatarImage src={row.avatar_url} alt="" />}
                    <AvatarFallback className="bg-secondary text-xs font-bold">{getInitials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {name}
                      {mine && <span className="ml-2 text-xs font-normal text-primary">(vos)</span>}
                    </p>
                    {row.username && <p className="truncate text-xs text-muted-foreground">@{row.username}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold tabular-nums">{row.total_points}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.scored_races} {row.scored_races === 1 ? "carrera" : "carreras"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </>
  );
}
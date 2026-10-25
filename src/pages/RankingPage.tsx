import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
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

// Mismos puntos, mismo lugar.
function computeRanks(rows: LeaderboardRow[]): number[] {
  const ranks: number[] = [];
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    ranks.push(previous && previous.total_points === row.total_points ? (ranks[index - 1] ?? index + 1) : index + 1);
  });
  return ranks;
}

function Board({ rows, userId }: { rows: LeaderboardRow[]; userId: string | undefined }) {
  const ranks = computeRanks(rows);

  return (
    <ol className="space-y-2">
      {rows.map((row, index) => {
        const mine = row.user_id === userId;
        const name = row.display_name || row.username || "Sin nombre";

        return (
          <li key={row.user_id}>
            <Link
              to="/usuario/$id"
              params={{ id: row.user_id }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors hover:bg-accent/40",
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
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function RankingPage() {
  const season = new Date().getFullYear();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [everyone, setEveryone] = useState<LeaderboardRow[]>([]);
  const [friends, setFriends] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !userId) return;
    let cancelled = false;

    async function load() {
      const [all, mine] = await Promise.all([
        supabase.rpc("get_leaderboard", { p_season: season }),
        supabase.rpc("get_friends_leaderboard", { p_season: season }),
      ]);
      if (cancelled) return;

      if (all.error || mine.error) {
        console.error("Cargar ranking:", all.error ?? mine.error);
        setError("No pudimos cargar el ranking.");
      } else {
        setEveryone(all.data ?? []);
        setFriends(mine.data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, userId, season]);

  const inEveryone = everyone.some((row) => row.user_id === userId);

  return (
    <>
      <PageHeader title="Ranking" subtitle={`Puntos de predicciones de la temporada ${season}.`} />

      {error && <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando el ranking…</p>
      ) : (
        <Tabs defaultValue="todos">
          <TabsList className="mb-4">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="amigos">Amigos</TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-4">
            {!inEveryone && (
              <p className="text-sm text-muted-foreground">
                No aparecés en este ranking. Para aparecer necesitás un nombre de usuario (Ajustes → Perfil) y tener
                activada la visibilidad en Ajustes → Privacidad.
              </p>
            )}
            {everyone.length === 0 ? (
              <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
                Todavía no hay nadie en el ranking.
              </div>
            ) : (
              <Board rows={everyone} userId={userId} />
            )}
          </TabsContent>

          <TabsContent value="amigos" className="space-y-4">
            {friends.length <= 1 && (
              <p className="text-sm text-muted-foreground">
                Todavía no tenés amigos en la app. Buscalos en{" "}
                <Link to="/amigos" className="font-semibold text-primary hover:underline">
                  Amigos
                </Link>
                .
              </p>
            )}
            <Board rows={friends} userId={userId} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

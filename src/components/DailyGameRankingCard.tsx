import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { computeGameRanks, useGameLeaderboard } from "@/hooks/useGameLeaderboard";
import { getInitials } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

// Orden visual del podio: 2.º, 1.º, 3.º.
const SLOTS = [
  { index: 1, pedestal: "h-11", avatar: "h-12 w-12" },
  { index: 0, pedestal: "h-16", avatar: "h-16 w-16" },
  { index: 2, pedestal: "h-8", avatar: "h-12 w-12" },
] as const;

export function DailyGameRankingCard() {
  const { userId, everyone, loading, error } = useGameLeaderboard(0);

  if (error) return null;

  const ranks = computeGameRanks(everyone);
  const myIndex = everyone.findIndex((row) => row.user_id === userId);
  const myRow = myIndex >= 0 ? everyone[myIndex] : undefined;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Juego diario</h2>
        <Link to="/juego" className="text-sm font-semibold text-primary hover:underline">
          Jugar el de hoy
        </Link>
      </div>

      {loading ? (
        <div className="h-52 animate-pulse rounded-2xl border bg-secondary/40" />
      ) : (
        <div className="rounded-2xl border bg-card p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Top de la semana</p>

          {everyone.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía nadie sumó puntos esta semana. ¡Sé el primero!
            </p>
          ) : (
            <div className="grid grid-cols-3 items-end gap-2">
              {SLOTS.map(({ index, pedestal, avatar }) => {
                const row = everyone[index];
                const rank = ranks[index] ?? index + 1;

                if (!row) {
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className={cn("rounded-full border border-dashed", avatar)} />
                      <div className={cn("mt-6 w-full rounded-t-lg bg-secondary/40", pedestal)} />
                    </div>
                  );
                }

                const name = row.display_name || row.username || "Sin nombre";
                return (
                  <Link
                    key={row.user_id}
                    to="/usuario/$id"
                    params={{ id: row.user_id }}
                    className="group flex flex-col items-center text-center"
                  >
                    <Avatar
                      className={cn("transition-transform group-hover:-translate-y-1", avatar, rank === 1 && "ring-2 ring-primary")}
                    >
                      {row.avatar_url && <AvatarImage src={row.avatar_url} alt="" />}
                      <AvatarFallback className="bg-secondary text-xs font-bold">{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <p className="mt-1 w-full truncate text-xs font-semibold">{name}</p>
                    <p className="mb-1 text-xs tabular-nums text-muted-foreground">{row.total_points} pts</p>
                    <div
                      className={cn(
                        "flex w-full items-start justify-center rounded-t-lg pt-1 font-display text-base font-bold",
                        pedestal,
                        rank === 1 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
                      )}
                    >
                      {rank}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-4 border-t pt-3 text-sm">
            {!userId ? (
              <p className="text-muted-foreground">
                Jugá sin cuenta y{" "}
                <Link to="/registro" className="font-semibold text-primary hover:underline">
                  creá una
                </Link>{" "}
                para competir en el ranking semanal.
              </p>
            ) : myRow && myIndex >= 3 ? (
              <p>
                Tu posición: <span className="font-bold">#{ranks[myIndex] ?? myIndex + 1}</span> ·{" "}
                <span className="tabular-nums">{myRow.total_points} pts</span>
              </p>
            ) : !myRow ? (
              <p className="text-muted-foreground">Todavía no sumaste esta semana. ¡Jugá el circuito de hoy!</p>
            ) : (
              <p className="text-muted-foreground">¡Estás en el podio de la semana!</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
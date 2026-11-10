import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { computeRanks, useLeaderboards, type LeaderboardRow } from "@/hooks/useLeaderboards";
import { getInitials } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

type Tab = "amigos" | "todos";

function Row({ row, rank, mine }: { row: LeaderboardRow; rank: number; mine: boolean }) {
  const name = row.display_name || row.username || "Sin nombre";

  return (
    <li>
      <Link
        to="/usuario/$id"
        params={{ id: row.user_id }}
        className={cn(
          "card-link flex items-center gap-3 rounded-2xl border bg-card p-3 hover:bg-accent/40",          
          mine && "border-primary/60",
        )}
      >
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-base font-bold",
            rank === 1 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
          )}
        >
          {rank}
        </span>
        <Avatar className="h-9 w-9">
          {row.avatar_url && <AvatarImage src={row.avatar_url} alt="" />}
          <AvatarFallback className="bg-secondary text-xs font-bold">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 flex-1 truncate font-semibold">
          {name}
          {mine && <span className="ml-2 text-xs font-normal text-primary">(vos)</span>}
        </p>
        <p className="font-display text-xl font-bold tabular-nums">
          {row.total_points} <span className="text-xs font-normal text-muted-foreground">pts</span>
        </p>
      </Link>
    </li>
  );
}

export function RankingPreview({ season }: { season: number }) {
  const { userId, everyone, friends, loading, error } = useLeaderboards(season);
  const [tab, setTab] = useState<Tab | null>(null);

  if (loading || error) return null;

  // Si todavía no tenés amigos, arranca en "Todos".
  const active: Tab = tab ?? (friends.length > 1 ? "amigos" : "todos");
  const rows = active === "amigos" ? friends : everyone;
  const ranks = computeRanks(rows);
  const myIndex = rows.findIndex((row) => row.user_id === userId);
  const myRow = myIndex >= 0 ? rows[myIndex] : undefined;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Ranking de Predicciones</h2>
        <Link to="/ranking" className="text-sm font-semibold text-primary hover:underline">
          Ver ranking completo
        </Link>
      </div>

      <div className="mb-3 inline-flex rounded-lg border bg-card p-1 text-sm">
        {(["amigos", "todos"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={active === value}
            className={cn(
              "rounded-md px-3 py-1.5 font-semibold transition-colors",
              active === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "amigos" ? "Amigos" : "Todos"}
          </button>
        ))}
      </div>

      {active === "amigos" && friends.length <= 1 && (
        <p className="mb-3 text-sm text-muted-foreground">
          Todavía no tenés amigos en la app. Buscalos en{" "}
          <Link to="/amigos" className="font-semibold text-primary hover:underline">
            Amigos
          </Link>
          .
        </p>
      )}

      {active === "todos" && !myRow && (
        <p className="mb-3 text-sm text-muted-foreground">
          No aparecés en este ranking. Para aparecer necesitás un nombre de usuario y tener activada la
          visibilidad en{" "}
          <Link to="/ajustes" className="font-semibold text-primary hover:underline">
            Ajustes
          </Link>
          .
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay nadie en este ranking.
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.slice(0, 3).map((row, index) => (
            <Row key={row.user_id} row={row} rank={ranks[index] ?? index + 1} mine={row.user_id === userId} />
          ))}
          {myRow && myIndex >= 3 && (
            <>
              <li aria-hidden className="text-center text-xs text-muted-foreground">
                ⋯
              </li>
              <Row row={myRow} rank={ranks[myIndex] ?? myIndex + 1} mine />
            </>
          )}
        </ol>
      )}
    </section>
  );
}
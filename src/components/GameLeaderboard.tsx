import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { computeGameRanks, useGameLeaderboard, type GameLeaderboardRow } from "@/hooks/useGameLeaderboard";
import { getInitials } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

type Scope = "amigos" | "todos";
type Week = 0 | -1;

const TOP = 10;

function Row({ row, rank, mine }: { row: GameLeaderboardRow; rank: number; mine: boolean }) {
  const name = row.display_name || row.username || "Sin nombre";

  return (
    <li className="fade-up">
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
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {name}
            {mine && <span className="ml-2 text-xs font-normal text-primary">(vos)</span>}
          </p>
          {row.username && <p className="truncate text-xs text-muted-foreground">@{row.username}</p>}
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold tabular-nums">
            {row.total_points} <span className="text-xs font-normal text-muted-foreground">pts</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {row.solved_days} {row.solved_days === 1 ? "día" : "días"}
          </p>
        </div>
      </Link>
    </li>
  );
}

function Toggle<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-card p-1 text-sm">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "rounded-md px-3 py-1.5 font-semibold transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function GameLeaderboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [week, setWeek] = useState<Week>(0);
  const [scope, setScope] = useState<Scope | null>(null);
  const { userId, everyone, friends, loading, error } = useGameLeaderboard(week, refreshKey);

  if (loading) return null;

  if (!userId) {
    return (
      <section className="mt-10">
        <h2 className="mb-3 text-2xl font-bold uppercase">Ranking semanal</h2>
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Iniciá sesión
          </Link>{" "}
          para sumar puntos y competir en el ranking semanal.
        </div>
      </section>
    );
  }

  // Si todavía no tenés amigos, arranca en "Todos".
  const active: Scope = scope ?? (friends.length > 1 ? "amigos" : "todos");
  const rows = active === "amigos" ? friends : everyone;
  const ranks = computeGameRanks(rows);
  const myIndex = rows.findIndex((row) => row.user_id === userId);
  const myRow = myIndex >= 0 ? rows[myIndex] : undefined;

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-2xl font-bold uppercase">Ranking semanal</h2>

      <div className="mb-3 flex flex-wrap gap-2">
        <Toggle<Scope>
          value={active}
          onChange={setScope}
          options={[
            { value: "amigos", label: "Amigos" },
            { value: "todos", label: "Todos" },
          ]}
        />
        <Toggle<Week>
          value={week}
          onChange={setWeek}
          options={[
            { value: 0, label: "Esta semana" },
            { value: -1, label: "Semana pasada" },
          ]}
        />
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        6 puntos si lo resolvés en 1 intento, 5 en 2, y así hasta 1 punto en el 6.º. La semana va de lunes a domingo.
      </p>

      {error && <p className="mb-3 rounded-md bg-destructive/15 p-2 text-sm text-destructive">No pudimos cargar el ranking.</p>}

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
          No aparecés en este ranking: necesitás haber resuelto el circuito al menos un día de la semana, tener un
          nombre de usuario y la visibilidad activada en{" "}
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
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-2">
          {rows.slice(0, TOP).map((row, index) => (
            <Row key={row.user_id} row={row} rank={ranks[index] ?? index + 1} mine={row.user_id === userId} />
          ))}
          {myRow && myIndex >= TOP && (
            <>
              <li aria-hidden className="col-span-full text-center text-xs text-muted-foreground">
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
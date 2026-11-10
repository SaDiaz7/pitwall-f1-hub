import { useEffect, useState, type CSSProperties } from "react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { getDriverSeasonResults, type DriverRaceResult } from "@/lib/f1";
import type { Driver } from "@/lib/types";
import { cn } from "@/lib/utils";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; mine: DriverRaceResult[]; mate: DriverRaceResult[] };

// Cuenta quién terminó adelante y quién largó adelante, solo en carreras donde fueron del mismo equipo.
function computeDuel(mine: DriverRaceResult[], mate: DriverRaceResult[]) {
  const mateByRound = new Map(mate.map((result) => [result.round, result]));
  let rounds = 0;
  let raceA = 0;
  let raceB = 0;
  let gridA = 0;
  let gridB = 0;

  for (const a of mine) {
    const b = mateByRound.get(a.round);
    if (!b || b.teamName !== a.teamName) continue;
    rounds += 1;

    if (a.position < b.position) raceA += 1;
    else if (b.position < a.position) raceB += 1;

    // Grilla 0 = largó desde boxes: no se compara.
    if (a.grid > 0 && b.grid > 0) {
      if (a.grid < b.grid) gridA += 1;
      else if (b.grid < a.grid) gridB += 1;
    }
  }

  return { rounds, raceA, raceB, gridA, gridB };
}

function DuelRow({
  label,
  a,
  b,
  colorA,
  colorB,
  index,
}: {
  label: string;
  a: number;
  b: number;
  colorA: string;
  colorB: string;
  index: number;
}) {
  const total = a + b;
  const percentA = total > 0 ? (a / total) * 100 : 0;
  const percentB = total > 0 ? (b / total) * 100 : 0;

  return (
    <div className="fade-up space-y-1.5" style={{ "--i": index } as CSSProperties}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-3">
        <span className={cn("text-right font-display text-2xl font-bold tabular-nums", a > b && "text-primary")}>
          {a}
        </span>
        <span className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={cn("text-left font-display text-2xl font-bold tabular-nums", b > a && "text-primary")}>
          {b}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="rotate-180">
          <AnimatedBar percent={percentA} color={colorA} className="h-2" />
        </div>
        <AnimatedBar percent={percentB} color={colorB} className="h-2" />
      </div>
    </div>
  );
}

export function TeammateDuel({
  driver,
  mate,
  colorA,
  colorB,
}: {
  driver: Driver;
  mate: Driver;
  colorA: string;
  colorB: string;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    Promise.all([
      getDriverSeasonResults({ data: { id: driver.id } }),
      getDriverSeasonResults({ data: { id: mate.id } }),
    ])
      .then(([mine, mateResults]) => {
        if (!cancelled) setState({ status: "done", mine, mate: mateResults });
      })
      .catch((error) => {
        console.error("Duelo con el compañero:", error);
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [driver.id, mate.id]);

  if (state.status === "loading") {
    return (
      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-10 w-full" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        No pudimos cargar el duelo en pista. Probá de nuevo en un rato.
      </div>
    );
  }

  const { rounds, raceA, raceB, gridA, gridB } = computeDuel(state.mine, state.mate);

  if (rounds === 0) {
    return (
      <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        Todavía no compartieron ninguna carrera como compañeros de equipo esta temporada.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-bold uppercase">Duelo en pista</h3>
        <span className="text-xs text-muted-foreground">
          {rounds} {rounds === 1 ? "carrera" : "carreras"} juntos
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
        <p className="truncate border-b-2 pb-1 text-right" style={{ borderBottomColor: colorA }}>
          {driver.name}
        </p>
        <p className="truncate border-b-2 pb-1 text-left" style={{ borderBottomColor: colorB }}>
          {mate.name}
        </p>
      </div>

      <DuelRow label="Llegó adelante" a={raceA} b={raceB} colorA={colorA} colorB={colorB} index={0} />
      <DuelRow label="Largó adelante" a={gridA} b={gridB} colorA={colorA} colorB={colorB} index={1} />

      <p className="text-xs text-muted-foreground">
        Solo carreras del domingo: no incluye sprints. "Largó adelante" usa la posición de grilla, que puede incluir
        sanciones.
      </p>
    </div>
  );
}
import { useEffect, useState, type CSSProperties } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedBar } from "@/components/AnimatedBar";
import { getDriverSeasonResults, type DriverRaceResult } from "@/lib/f1";

const NOT_FINISHED: Record<string, string> = {
  R: "Abandonó",
  D: "Descalificado",
  W: "Se retiró",
  E: "Excluido",
  F: "No clasificó",
  N: "No clasificado",
};

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; results: DriverRaceResult[] };

// Para apagar la animación del gráfico si la persona pidió menos movimiento.
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduced;
}

function MiniStat({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <div className="fade-up rounded-xl border bg-secondary/40 p-3" style={{ "--i": index } as CSSProperties}>
      <p className="font-display text-2xl font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

export function DriverSeasonResults({ driverId, color }: { driverId: string; color: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const reduced = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    getDriverSeasonResults({ data: { id: driverId } })
      .then((results) => {
        if (!cancelled) setState({ status: "done", results });
      })
      .catch((error) => {
        console.error("Resultados del piloto:", error);
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [driverId]);

  if (state.status === "loading") {
    return (
      <section className="my-6 space-y-3 rounded-2xl border bg-card p-5">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="my-6 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        No pudimos cargar los resultados de la temporada. Probá de nuevo en un rato.
      </section>
    );
  }

  const { results } = state;

  if (results.length === 0) {
    return (
      <section className="my-6 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        Todavía no corrió ninguna carrera esta temporada.
      </section>
    );
  }

  const maxPoints = Math.max(...results.map((r) => r.points), 0);
  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const finishedPositions = results.filter((r) => /^\d+$/.test(r.positionText)).map((r) => r.position);
  const best = finishedPositions.length > 0 ? Math.min(...finishedPositions) : null;
  const retirements = results.filter((r) => !/^\d+$/.test(r.positionText)).length;

  const chartData = results.map((r) => ({ label: `R${r.round}`, points: r.points }));
  const nameByLabel = new Map(results.map((r) => [`R${r.round}`, r.raceName]));

  return (
    <section className="my-6 space-y-5 rounded-2xl border bg-card p-5">
      <h2 className="text-xl font-bold uppercase">Su temporada</h2>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat index={0} label="Mejor resultado" value={best === null ? "—" : `P${best}`} />
        <MiniStat index={1} label="Pts en carreras" value={String(totalPoints)} />
        <MiniStat index={2} label="Abandonos" value={String(retirements)} />
      </div>

      <div className="fade-up h-48 w-full" style={{ "--i": 3 } as CSSProperties}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent)", opacity: 0.4 }}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelFormatter={(label) => nameByLabel.get(String(label)) ?? String(label)}
              formatter={(value) => [`${value} pts`, "Puntos"]}
            />
            <Bar
              dataKey="points"
              fill={color}
              radius={[6, 6, 0, 0]}
              isAnimationActive={!reduced}
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="divide-y">
        {results.map((r, i) => {
          const finished = /^\d+$/.test(r.positionText);
          const fromPits = r.grid === 0;
          const change = finished && !fromPits ? r.grid - r.position : 0;

          return (
            <li key={r.round} className="fade-up py-3" style={{ "--i": Math.min(i, 8) } as CSSProperties}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold">
                  <span className="mr-2 tabular-nums text-muted-foreground">R{r.round}</span>
                  {r.raceName}
                </p>
                <p className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums">
                  <span>
                    {fromPits ? "Boxes" : `P${r.grid}`} →{" "}
                    {finished ? (
                      `P${r.position}`
                    ) : (
                      <span className="text-red-400">{NOT_FINISHED[r.positionText] ?? "No terminó"}</span>
                    )}
                  </span>
                  {change > 0 && <span className="text-xs text-emerald-400">▲{change}</span>}
                  {change < 0 && <span className="text-xs text-red-400">▼{Math.abs(change)}</span>}
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <AnimatedBar
                  percent={maxPoints > 0 ? (r.points / maxPoints) * 100 : 0}
                  color={color}
                  className="flex-1"
                />
                <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">+{r.points} pts</span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        Grilla → llegada en cada carrera. Los puntos de las carreras sprint no están en este gráfico, así que el
        total puede ser menor al del campeonato.
      </p>
    </section>
  );
}
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  buildAnalysis,
  type Comeback,
  type ResultRow,
  type RoundInfo,
  type Series,
  type Tally,
} from "@/lib/analysis";
import { cn } from "@/lib/utils";

const GRID_COLOR = "#2a2a31";
const AXIS_COLOR = "#9ca3af";

type EntityKind = "pilotos" | "constructores";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border bg-background/40 p-1 text-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
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

function EvolutionTooltip({
  active,
  payload,
  label,
  rounds,
  seriesById,
  ascending,
}: TooltipProps<ValueType, NameType> & {
  rounds: RoundInfo[];
  seriesById: Map<string, Series>;
  ascending: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const round = rounds.find((item) => item.round === label);
  const items = payload
    .map((entry) => ({
      series: seriesById.get(String(entry.dataKey)),
      value: typeof entry.value === "number" ? entry.value : null,
    }))
    .filter((item): item is { series: Series; value: number } => item.series !== undefined && item.value !== null)
    .sort((a, b) => (ascending ? a.value - b.value : b.value - a.value))
    .slice(0, 12);

  return (
    <div className="rounded-lg border bg-card p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold">
        Ronda {label}
        {round ? ` · ${round.name}` : ""}
      </p>
      <ul className="space-y-1">
        {items.map(({ series, value }) => (
          <li key={series.id} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
            <span className="flex-1">{series.label}</span>
            <span className="font-semibold tabular-nums">{ascending ? `P${value}` : value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvolutionChart({
  title,
  kind,
  rounds,
  driverSeries,
  constructorSeries,
}: {
  title: string;
  kind: "points" | "positions";
  rounds: RoundInfo[];
  driverSeries: Series[];
  constructorSeries: Series[];
}) {
  const [entity, setEntity] = useState<EntityKind>("pilotos");
  const [hiddenByEntity, setHiddenByEntity] = useState<Partial<Record<EntityKind, Set<string>>>>({});

  const series = entity === "pilotos" ? driverSeries : constructorSeries;
  const hidden = hiddenByEntity[entity] ?? new Set(series.slice(10).map((item) => item.id));

  const setHidden = (next: Set<string>) => setHiddenByEntity((current) => ({ ...current, [entity]: next }));
  const toggle = (id: string) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHidden(next);
  };

  const data = useMemo(
    () =>
      rounds.map((round, index) => {
        const row: Record<string, number | null> = { round: round.round };
        for (const item of series) row[item.id] = item.values[index] ?? null;
        return row;
      }),
    [rounds, series],
  );

  const seriesById = useMemo(() => new Map(series.map((item) => [item.id, item])), [series]);

  const maxPosition = Math.max(
    1,
    ...series.flatMap((item) => item.values).filter((value): value is number => value !== null),
  );

  let ticks: number[] | undefined;
  if (kind === "positions") {
    const step = maxPosition > 12 ? 5 : 2;
    ticks = [];
    for (let value = 1; value <= maxPosition; value += step) ticks.push(value);
    if (ticks[ticks.length - 1] !== maxPosition) ticks.push(maxPosition);
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold uppercase">{title}</h2>
        <Segmented
          label="Pilotos o constructores"
          value={entity}
          options={[
            { value: "pilotos", label: "Pilotos" },
            { value: "constructores", label: "Constructores" },
          ]}
          onChange={setEntity}
        />
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="round"
              stroke={GRID_COLOR}
              tick={{ fill: AXIS_COLOR, fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={14}
            />
            <YAxis
              stroke={GRID_COLOR}
              tick={{ fill: AXIS_COLOR, fontSize: 12 }}
              allowDecimals={false}
              {...(kind === "positions" ? { reversed: true, domain: [1, maxPosition] as [number, number] } : {})}
              {...(ticks ? { ticks } : {})}
            />
            <Tooltip
              content={(props) => (
                <EvolutionTooltip
                  {...props}
                  rounds={rounds}
                  seriesById={seriesById}
                  ascending={kind === "positions"}
                />
              )}
            />
            {series
              .filter((item) => !hidden.has(item.id))
              .map((item) => (
                <Line
                  key={item.id}
                  dataKey={item.id}
                  type="monotone"
                  stroke={item.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                  {...(item.dashed ? { strokeDasharray: "5 4" } : {})}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {series.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={!hidden.has(item.id)}
              onClick={() => toggle(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold transition-opacity hover:bg-accent/40",
                hidden.has(item.id) && "opacity-35",
              )}
            >
              <span
                className="inline-block w-6 border-t-2"
                style={{ borderColor: item.color, borderStyle: item.dashed ? "dashed" : "solid" }}
              />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Tocá un nombre para mostrarlo u ocultarlo.</span>
          <button
            type="button"
            onClick={() => setHidden(new Set(series.slice(10).map((item) => item.id)))}
            className="font-semibold text-primary hover:underline"
          >
            Top 10
          </button>
          <button type="button" onClick={() => setHidden(new Set())} className="font-semibold text-primary hover:underline">
            Todos
          </button>
        </div>
      </div>
    </section>
  );
}

function ComebacksChart({ comebacks }: { comebacks: Comeback[] }) {
  const data = comebacks.slice(0, 10);

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="text-xl font-bold uppercase">Mejores remontadas</h2>
        <p className="text-sm text-muted-foreground">
          Suma de posiciones ganadas entre la grilla de largada y el resultado final, en todas las carreras de la
          temporada (solo cuentan quienes terminaron).
        </p>
      </div>

      <div className="w-full" style={{ height: Math.max(220, data.length * 34 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
            <XAxis type="number" stroke={GRID_COLOR} tick={{ fill: AXIS_COLOR, fontSize: 12 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={44}
              stroke={GRID_COLOR}
              tick={{ fill: AXIS_COLOR, fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.06)" }}
              contentStyle={{ background: "#17171c", border: "1px solid #2a2a31", borderRadius: 8 }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value) => [`${value}`, "Posiciones ganadas"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((item) => (
                <Cell key={item.id} fill={item.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TallyTable({ tally }: { tally: Tally[] }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? tally : tally.slice(0, 12);

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <h2 className="text-xl font-bold uppercase">Victorias, podios y vueltas rápidas</h2>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Piloto</th>
              <th className="px-3 py-2 text-right" title="Victorias">
                V
              </th>
              <th className="px-3 py-2 text-right" title="Podios">
                P
              </th>
              <th className="px-3 py-2 text-right" title="Vueltas rápidas">
                VR
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-5 w-1 rounded-sm" style={{ backgroundColor: row.color }} />
                    <span className="font-semibold">{row.label}</span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:inline">{row.name}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{row.wins}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.podiums}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">{row.fastest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tally.length > 12 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {showAll ? "Ver menos" : "Ver todos"}
        </button>
      )}
      <p className="text-xs text-muted-foreground">V: victorias · P: podios · VR: vueltas rápidas.</p>
    </section>
  );
}

export function AnalysisPage() {
  const season = new Date().getFullYear();
  const [rows, setRows] = useState<ResultRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc("get_season_results", { p_season: season }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Cargar análisis:", error);
        setFailed(true);
        return;
      }
      setRows((data ?? []) as ResultRow[]);
    });

    return () => {
      cancelled = true;
    };
  }, [season]);

  const analysis = useMemo(() => (rows ? buildAnalysis(rows) : null), [rows]);

  return (
    <>
      <PageHeader title="Análisis" subtitle={`Datos de la temporada ${season}, carrera a carrera.`} />

      {failed ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          No pudimos cargar el análisis en este momento. Probá de nuevo en un rato.
        </div>
      ) : !analysis ? (
        <p className="text-sm text-muted-foreground">Cargando análisis…</p>
      ) : analysis.rounds.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay datos para mostrar. Las gráficas se arman con los resultados de cada carrera, que se cargan
          después de cada Gran Premio.
        </div>
      ) : (
        <div className="space-y-6">
          <EvolutionChart
            title="Evolución de puntos"
            kind="points"
            rounds={analysis.rounds}
            driverSeries={analysis.driverPoints}
            constructorSeries={analysis.constructorPoints}
          />
          <EvolutionChart
            title="Evolución de posiciones"
            kind="positions"
            rounds={analysis.rounds}
            driverSeries={analysis.driverPositions}
            constructorSeries={analysis.constructorPositions}
          />
          <ComebacksChart comebacks={analysis.comebacks} />
          <TallyTable tally={analysis.tally} />
          <p className="text-xs text-muted-foreground">
            Puntos y posiciones calculados con los resultados de cada carrera y sprint. Datos: Jolpica-F1.
          </p>
        </div>
      )}
    </>
  );
}
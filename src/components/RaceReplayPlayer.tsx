import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDriverStandings, getRaceReplay, type RaceReplay as ReplayData, type ReplayDriver } from "@/lib/f1";
import { getTeamColor } from "@/lib/team-colors";
import { cn } from "@/lib/utils";

const W = 900;
const MARGIN = { top: 14, right: 46, bottom: 30, left: 36 };
const ROW = 26;
const GRID_COLOR = "#2a2a31";
const AXIS_COLOR = "#9ca3af";
const FALLBACK_COLOR = "#6B7280";

const SPEEDS = [
  { label: "1×", lapsPerSecond: 2 },
  { label: "2×", lapsPerSecond: 4 },
  { label: "4×", lapsPerSecond: 8 },
] as const;

type LoadState = "loading" | "ready" | "empty" | "error";

interface Entry {
  driver: ReplayDriver;
  color: string;
  dashed: boolean;
}

// Posición en una vuelta (puede ser decimal): va interpolando entre una vuelta y la siguiente.
function positionAt(positions: (number | null)[], lap: number): number | null {
  const base = Math.floor(lap);
  const from = positions[base] ?? null;
  if (from === null) return null;

  const frac = lap - base;
  if (frac === 0) return from;

  const to = positions[base + 1] ?? null;
  if (to === null) return from; // abandona en esta vuelta: se queda hasta que termina
  return from + (to - from) * frac;
}

function linePath(positions: (number | null)[], x: (n: number) => number, y: (n: number) => number): string {
  let path = "";
  let drawing = false;
  positions.forEach((position, lap) => {
    if (position === null) {
      drawing = false;
      return;
    }
    path += `${drawing ? "L" : "M"}${x(lap).toFixed(1)} ${y(position).toFixed(1)} `;
    drawing = true;
  });
  return path;
}

function makeGeometry(total: number, count: number) {
  const innerWidth = W - MARGIN.left - MARGIN.right;
  const span = total > 0 ? total : 1;
  return {
    height: MARGIN.top + MARGIN.bottom + Math.max(0, count - 1) * ROW,
    x: (value: number) => MARGIN.left + (value / span) * innerWidth,
    y: (position: number) => MARGIN.top + (position - 1) * ROW,
  };
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="text-xl font-bold uppercase">Replay de la carrera</h2>
        <p className="text-sm text-muted-foreground">
          Cómo cambió la posición de cada piloto vuelta a vuelta. Tocá un piloto para resaltarlo; los círculos blancos
          son paradas en boxes y la × marca un abandono.
        </p>
      </div>
      {children}
      <p className="text-xs text-muted-foreground">
        Datos: Jolpica-F1. El segundo piloto de cada equipo va con línea punteada.
      </p>
    </section>
  );
}

export function RaceReplayPlayer({ round }: { round: number }) {
  const [state, setState] = useState<LoadState>("loading");
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [teamColors, setTeamColors] = useState<Record<string, string>>({});

  const [lap, setLap] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [focus, setFocus] = useState<string | null>(null);
  const lapRef = useRef(0);

  const total = replay?.totalLaps ?? 0;
  const lapsPerSecond = SPEEDS[speedIndex]?.lapsPerSecond ?? 4;

  // Carga de datos: el replay y, para los colores, la tabla de pilotos de la temporada.
  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setPlaying(false);
    lapRef.current = 0;
    setLap(0);

    async function load() {
      try {
        const [data, standings] = await Promise.all([
          getRaceReplay({ data: { round } }),
          getDriverStandings().catch(() => null),
        ]);
        if (cancelled) return;

        const colors: Record<string, string> = {};
        for (const driver of standings ?? []) {
          if (!driver.teamName) continue;
          colors[driver.teamName] = getTeamColor(driver.teamId, driver.teamName);
        }
        setTeamColors(colors);
        setReplay(data);
        setState(data ? "ready" : "empty");
      } catch (error) {
        console.error("Replay de la carrera:", error);
        if (!cancelled) setState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [round]);

  // Pilotos en orden de llegada, con su color; el segundo de cada equipo va punteado.
  const entries = useMemo<Entry[]>(() => {
    if (!replay) return [];
    const seenTeams = new Set<string>();
    return [...replay.drivers]
      .sort((a, b) => a.finish - b.finish)
      .map((driver) => {
        const dashed = seenTeams.has(driver.teamName);
        seenTeams.add(driver.teamName);
        return { driver, color: teamColors[driver.teamName] ?? FALLBACK_COLOR, dashed };
      });
  }, [replay, teamColors]);

  const geometry = useMemo(() => makeGeometry(total, entries.length), [total, entries.length]);

  const paths = useMemo(
    () => entries.map(({ driver }) => linePath(driver.positions, geometry.x, geometry.y)),
    [entries, geometry],
  );

  // Animación: avanza la vuelta según el tiempo real transcurrido.
  useEffect(() => {
    if (!playing || total === 0) return;
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - previous) / 1000;
      previous = now;
      lapRef.current = Math.min(total, lapRef.current + elapsed * lapsPerSecond);
      setLap(lapRef.current);

      if (lapRef.current >= total) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total, lapsPerSecond]);

  if (state === "loading") {
    return (
      <Frame>
        <p className="text-sm text-muted-foreground">Cargando el replay… (la primera vez puede tardar unos segundos)</p>
      </Frame>
    );
  }
  if (state === "error") {
    return (
      <Frame>
        <p className="text-sm text-muted-foreground">No pudimos cargar el replay en este momento. Probá de nuevo en un rato.</p>
      </Frame>
    );
  }
  if (state === "empty" || !replay) {
    return (
      <Frame>
        <p className="text-sm text-muted-foreground">Todavía no hay datos vuelta por vuelta de esta carrera.</p>
      </Frame>
    );
  }

  const { height, x, y } = geometry;
  const clipId = `replay-reveal-${round}`;
  const tickStep = total > 40 ? 10 : 5;
  const ticks: number[] = [0];
  for (let t = tickStep; t <= total; t += tickStep) ticks.push(t);

  const byId = new Map(entries.map((entry) => [entry.driver.id, entry]));
  const current = Math.min(Math.floor(lap), total);
  const rows = entries.map((entry) => ({ entry, position: entry.driver.positions[current] ?? null }));
  const running = rows
    .filter((row) => row.position !== null)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const out = rows.filter((row) => row.position === null);
  const pitNow = new Set(replay.pitStops.filter((stop) => stop.lap === current).map((stop) => stop.driverId));

  const lapLabel = lap < 0.01 ? "Largada" : lap >= total ? `Vuelta ${total} de ${total} · Final` : `Vuelta ${current} de ${total}`;

  const togglePlay = () => {
    if (!playing && lapRef.current >= total) {
      lapRef.current = 0;
      setLap(0);
    }
    setPlaying((value) => !value);
  };

  const restart = () => {
    lapRef.current = 0;
    setLap(0);
    setPlaying(false);
  };

  return (
    <Frame>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={togglePlay} className="bg-gradient-primary font-semibold">
          {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {playing ? "Pausar" : lap >= total ? "Ver de nuevo" : "Reproducir"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={restart}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
        </Button>

        <div role="group" aria-label="Velocidad" className="inline-flex rounded-lg border bg-background/40 p-1 text-sm">
          {SPEEDS.map((speed, index) => (
            <button
              key={speed.label}
              type="button"
              aria-pressed={speedIndex === index}
              onClick={() => setSpeedIndex(index)}
              className={cn(
                "rounded-md px-3 py-1 font-semibold transition-colors",
                speedIndex === index
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {speed.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-sm font-semibold tabular-nums">{lapLabel}</span>
      </div>

      <input
        type="range"
        min={0}
        max={total}
        step={0.01}
        value={lap}
        aria-label="Vuelta de la carrera"
        onChange={(event) => {
          const value = Number(event.target.value);
          lapRef.current = value;
          setLap(value);
        }}
        className="w-full accent-primary"
      />

      <svg
        role="img"
        aria-label="Posiciones de cada piloto vuelta a vuelta"
        viewBox={`0 0 ${W} ${height}`}
        className="h-auto w-full"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={x(lap)} height={height} />
          </clipPath>
        </defs>

        {/* Cuadrícula y números de posición */}
        {entries.map((_, index) => (
          <g key={index}>
            <line x1={MARGIN.left} x2={W - MARGIN.right} y1={y(index + 1)} y2={y(index + 1)} stroke={GRID_COLOR} strokeWidth={1} />
            <text x={MARGIN.left - 10} y={y(index + 1) + 4} textAnchor="end" fontSize={10} fill={AXIS_COLOR}>
              {index + 1}
            </text>
          </g>
        ))}

        {/* Números de vuelta */}
        {ticks.map((tick) => (
          <text key={tick} x={x(tick)} y={height - 8} textAnchor="middle" fontSize={10} fill={AXIS_COLOR}>
            {tick}
          </text>
        ))}

        {/* Recorrido completo (apagado) */}
        <g>
          {entries.map(({ driver, color, dashed }, index) => {
            const dim = focus !== null && focus !== driver.id;
            return (
              <path
                key={driver.id}
                d={paths[index] ?? ""}
                fill="none"
                stroke={color}
                strokeWidth={focus === driver.id ? 3.5 : 2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={dim ? 0.05 : 0.2}
                {...(dashed ? { strokeDasharray: "5 4" } : {})}
              />
            );
          })}
        </g>

        {/* Recorrido ya hecho (encendido) */}
        <g clipPath={`url(#${clipId})`}>
          {entries.map(({ driver, color, dashed }, index) => {
            const dim = focus !== null && focus !== driver.id;
            return (
              <path
                key={driver.id}
                d={paths[index] ?? ""}
                fill="none"
                stroke={color}
                strokeWidth={focus === driver.id ? 3.5 : 2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={dim ? 0.18 : 1}
                {...(dashed ? { strokeDasharray: "5 4" } : {})}
              />
            );
          })}
        </g>

        {/* Paradas en boxes */}
        {replay.pitStops.map((stop, index) => {
          const entry = byId.get(stop.driverId);
          if (!entry || stop.lap > lap) return null;
          const position = entry.driver.positions[stop.lap] ?? null;
          if (position === null) return null;
          const dim = focus !== null && focus !== stop.driverId;
          return (
            <circle
              key={`${stop.driverId}-${index}`}
              cx={x(stop.lap)}
              cy={y(position)}
              r={3.5}
              fill="#0b0b0d"
              stroke="#ffffff"
              strokeWidth={1.5}
              opacity={dim ? 0.25 : 1}
            >
              <title>{`${entry.driver.name}: parada en la vuelta ${stop.lap} (${stop.duration} s)`}</title>
            </circle>
          );
        })}

        {/* Abandonos */}
        {entries.map(({ driver, color }) => {
          let last = -1;
          driver.positions.forEach((position, index) => {
            if (position !== null) last = index;
          });
          const lastPosition = last >= 0 ? (driver.positions[last] ?? null) : null;
          if (last < 0 || last >= total || lastPosition === null || lap < last) return null;
          const dim = focus !== null && focus !== driver.id;
          return (
            <text
              key={driver.id}
              x={x(last)}
              y={y(lastPosition) + 5}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fill={color}
              opacity={dim ? 0.25 : 1}
            >
              ×
              <title>{`${driver.name}: abandonó en la vuelta ${last}`}</title>
            </text>
          );
        })}

        {/* Pilotos en la vuelta actual */}
        {entries.map(({ driver, color }) => {
          const position = positionAt(driver.positions, lap);
          if (position === null) return null;
          const dim = focus !== null && focus !== driver.id;
          return (
            <g
              key={driver.id}
              opacity={dim ? 0.25 : 1}
              className="cursor-pointer"
              onMouseEnter={() => setFocus(driver.id)}
              onMouseLeave={() => setFocus(null)}
              onClick={() => setFocus((value) => (value === driver.id ? null : driver.id))}
            >
              <title>{driver.name}</title>
              <circle cx={x(lap)} cy={y(position)} r={8.5} fill={color} stroke="#0b0b0d" strokeWidth={2} />
              <text x={x(lap) + 14} y={y(position) + 4} fontSize={11} fontWeight={700} fill="#ffffff">
                {driver.code}
              </text>
            </g>
          );
        })}
      </svg>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {lap < 0.01 ? "Grilla de largada" : `Orden en la vuelta ${current}`}
        </h3>
        <ol className="gap-x-6 sm:columns-2">
          {running.map(({ entry, position }) => (
            <li
              key={entry.driver.id}
              onMouseEnter={() => setFocus(entry.driver.id)}
              onMouseLeave={() => setFocus(null)}
              className={cn(
                "flex break-inside-avoid items-center gap-2 rounded-md px-2 py-1 text-sm",
                focus === entry.driver.id && "bg-accent/40",
              )}
            >
              <span className="w-6 text-right font-display font-bold tabular-nums">{position}</span>
              <span className="h-5 w-1 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="font-semibold">{entry.driver.code}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{entry.driver.name}</span>
              {pitNow.has(entry.driver.id) && (
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase">Boxes</span>
              )}
            </li>
          ))}
        </ol>

        {out.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Fuera de carrera: {out.map(({ entry }) => entry.driver.code).join(", ")}
          </p>
        )}
      </div>
    </Frame>
  );
}
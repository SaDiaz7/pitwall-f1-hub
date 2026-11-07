import { useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
  ArrowLeft,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Crown,
  Droplets,
  MapPin,
  Play,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { CircuitFacts } from "@/components/CircuitFacts";
import { CircuitMap } from "@/components/CircuitMap";
import { PageHeader } from "@/components/PageHeader";
import { SessionsList } from "@/components/SessionsList";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDriverOfTheDay } from "@/hooks/useDriverOfTheDay";
import type { RaceResult, WeatherForecast } from "@/lib/f1";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamStripe } from "@/components/TeamStripe";
import { RaceReplayPlayer } from "@/components/RaceReplayPlayer";
import { DriverOfTheDay } from "@/components/DriverOfTheDay";
import { LiveBanner } from "@/components/LiveBanner";
import { SessionResultsTabs } from "@/components/SessionResultsTabs";

const route = getRouteApi("/_privado/gp/$round");

// Códigos de clima estándar (WMO) que usa Open-Meteo.
function describeWeather(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Despejado", Icon: Sun };
  if (code === 1) return { label: "Mayormente despejado", Icon: CloudSun };
  if (code === 2) return { label: "Parcialmente nublado", Icon: CloudSun };
  if (code === 3) return { label: "Nublado", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Niebla", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Llovizna", Icon: CloudDrizzle };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { label: "Lluvia", Icon: CloudRain };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { label: "Nieve", Icon: CloudSnow };
  if (code >= 95) return { label: "Tormenta", Icon: CloudLightning };
  return { label: "Variable", Icon: Cloud };
}

function formatStatus(status: string): string {
  if (status === "Finished") return "Finalizó";
  const lap = status.match(/^\+(\d+) Laps?$/);
  if (lap) return `+${lap[1]} ${lap[1] === "1" ? "vuelta" : "vueltas"}`;
  return status;
}

// Fecha YYYY-MM-DD en la zona horaria del circuito.
function dateInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const dayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// Cantidad de filas que se ven al principio; el resto se abre con "Ver los ...".
const COMPACT_ROWS = 10;

function ResultsTable({ results }: { results: RaceResult[] }) {
  const [showAll, setShowAll] = useState(false);

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        La clasificación no está disponible por el momento.
      </p>
    );
  }

  const rows = showAll ? results : results.slice(0, COMPACT_ROWS);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 text-left">Pos</th>
              <th className="px-2 py-1.5 text-left">Piloto</th>
              <th className="hidden px-2 py-1.5 text-left sm:table-cell">Equipo</th>
              <th className="px-2 py-1.5 text-right">Tiempo / estado</th>
              <th className="px-2 py-1.5 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.position}-${r.name}`} className="border-t">
                <td className="px-2 py-1.5">
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 font-display text-sm font-bold",
                      r.position === 1
                        ? "bg-gradient-primary text-primary-foreground"
                        : "bg-secondary",
                    )}
                  >
                    {r.positionText}
                  </span>
                </td>
                <td className="px-2 py-1.5 font-semibold">
                  <span className="flex items-center gap-2">
                    <TeamStripe teamName={r.teamName} className="h-5" />
                    {r.name}
                  </span>
                </td>
                <td className="hidden px-2 py-1.5 text-muted-foreground sm:table-cell">{r.teamName}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                  {r.time || formatStatus(r.status)}
                </td>
                <td className="px-2 py-1.5 text-right font-display font-bold tabular-nums">
                  {r.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.length > COMPACT_ROWS && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-3 text-sm font-semibold text-primary hover:underline"
        >
          {showAll ? "Ver menos" : `Ver los ${results.length}`}
        </button>
      )}
    </div>
  );
}

function WeatherCard({
  weather,
  raceStart,
  fallbackDate,
}: {
  weather: WeatherForecast | null;
  raceStart?: string | undefined;
  fallbackDate: string;
}) {
  // Día de la carrera en la hora local del circuito, y los dos días anteriores.
  const raceDay = weather && raceStart ? dateInZone(raceStart, weather.timezone) : fallbackDate;
  const weekend = [shiftDate(raceDay, -2), shiftDate(raceDay, -1), raceDay];
  const days = weather ? weather.days.filter((d) => weekend.includes(d.date)) : [];

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="text-xl font-bold uppercase">Pronóstico del fin de semana</h2>

      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {weather
            ? "El pronóstico va a estar disponible cuando falten 16 días o menos para la carrera."
            : "No pudimos cargar el pronóstico en este momento."}
        </p>
      ) : (
        <ul className="space-y-3">
          {days.map((day) => {
            const { label, Icon } = describeWeather(day.code);
            return (
              <li key={day.date} className="flex items-center gap-4">
                <Icon className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize">
                    {dayFormatter.format(new Date(`${day.date}T00:00:00Z`))}
                  </p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold tabular-nums">
                    {Math.round(day.max)}° / {Math.round(day.min)}°
                  </p>
                  <p className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
                    {day.rainChance !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Droplets className="h-3 w-3" /> {day.rainChance}%
                      </span>
                    )}
                    {day.wind !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Wind className="h-3 w-3" /> {Math.round(day.wind)} km/h
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Hora y clima del circuito{weather ? ` (${weather.timezone})` : ""}. Pronóstico:
        Open-Meteo.com.
      </p>
    </section>
  );
}

const CHIP_CLASS =
  "inline-flex shrink-0 items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/60 active:scale-95";

// Atajos siempre a la vista (también en celular) hacia las secciones de más abajo.
function QuickNav({ season, round, results }: { season: number; round: number; results: RaceResult[] }) {
  const dotd = useDriverOfTheDay(season, round);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const winner = dotd.status === "closed" ? dotd.tally[0] : undefined;
  const winnerName = winner ? (results.find((r) => r.driverId === winner.driver_id)?.name ?? null) : null;
  const open = dotd.status === "open";

  let dotdLabel = "Piloto del día";
  if (open) dotdLabel = "Piloto del día · votación abierta";
  else if (dotd.status === "closed" && winnerName) dotdLabel = `Piloto del día: ${winnerName}`;
  else if (dotd.status === "not_open" && !dotd.loading && !dotd.error) dotdLabel = "Piloto del día · pronto";

  return (
    <nav aria-label="Atajos de la página" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 py-1">
      <button
        type="button"
        onClick={() => go("piloto-del-dia")}
        className={cn(CHIP_CLASS, open && "border-primary/60 text-primary")}
      >
        {open && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        )}
        {dotd.status === "closed" && winnerName && <Crown className="h-4 w-4 text-amber-400" />}
        {dotdLabel}
      </button>

      <button type="button" onClick={() => go("replay")} className={CHIP_CLASS}>
        <Play className="h-4 w-4 text-primary" />
        Replay de la carrera
      </button>

      <button type="button" onClick={() => go("circuito")} className={cn(CHIP_CLASS, "lg:hidden")}>
        <MapPin className="h-4 w-4 text-primary" />
        Circuito
      </button>
    </nav>
  );
}

export function GrandPrixPage() {
  const { gp, results, weather } = route.useLoaderData();
  const finished = gp.status === "finalizado";
  const raceStart = gp.sessions.find((s) => s.name === "Carrera")?.start;
  const season = Number(gp.date.slice(0, 4));

  return (
    <>
      <Link
        to="/calendario"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al calendario
      </Link>

      <PageHeader title={gp.name} subtitle={`${gp.circuit} · ${gp.country}`} />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge status={gp.status} />
        <span className="text-muted-foreground">
          Ronda {gp.round} ·{" "}
          {formatDate(gp.date, { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      {!finished && <LiveBanner gp={gp} className="mb-6" />}
      {finished && <QuickNav season={season} round={gp.round} results={results} />}

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        {/* Circuito: a la izquierda en computadora; al final en celular */}
        <aside id="circuito" className="order-last scroll-mt-6 space-y-6 lg:sticky lg:top-6 lg:order-none">
          <section className="rounded-2xl border bg-card p-5">
            <div className="h-48 text-primary lg:h-56">
              <CircuitMap lat={gp.lat} lng={gp.lng} label={gp.circuit} />
            </div>
          </section>
          <CircuitFacts circuitId={gp.circuitId} circuitName={gp.circuit} />
        </aside>

        <div className="min-w-0 space-y-6">
          {finished ? (
            <>
              <section className="rounded-2xl border bg-card p-5">
                <Tabs defaultValue="carrera">
                  <TabsList className="mb-4">
                    <TabsTrigger value="carrera">Carrera</TabsTrigger>
                    <TabsTrigger value="sesiones">Otras sesiones</TabsTrigger>
                  </TabsList>
                  <TabsContent value="carrera">
                    <ResultsTable results={results} />
                  </TabsContent>
                  <TabsContent value="sesiones">
                    <SessionResultsTabs gp={gp} embedded />
                  </TabsContent>
                </Tabs>
              </section>

              <DriverOfTheDay season={season} round={gp.round} results={results} />

              <div id="replay" className="scroll-mt-6">
                <RaceReplayPlayer round={gp.round} />
              </div>
            </>
          ) : (
            <>
              <section className="space-y-3 rounded-2xl border bg-card p-5">
                <h2 className="text-xl font-bold uppercase">Horarios</h2>
                <SessionsList sessions={gp.sessions} />
              </section>
              <WeatherCard weather={weather} raceStart={raceStart} fallbackDate={gp.date} />
              <SessionResultsTabs gp={gp} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
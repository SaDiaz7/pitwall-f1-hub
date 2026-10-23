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
  Droplets,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { CircuitFacts } from "@/components/CircuitFacts";
import { CircuitMap } from "@/components/CircuitMap";
import { PageHeader } from "@/components/PageHeader";
import { SessionsList } from "@/components/SessionsList";
import { StatusBadge } from "@/components/StatusBadge";
import type { RaceResult, WeatherForecast } from "@/lib/f1";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamStripe } from "@/components/TeamStripe";

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

function ResultsTable({ results }: { results: RaceResult[] }) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        La clasificación no está disponible por el momento.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-2 py-2 text-left">Pos</th>
            <th className="px-2 py-2 text-left">Piloto</th>
            <th className="hidden px-2 py-2 text-left sm:table-cell">Equipo</th>
            <th className="px-2 py-2 text-right">Tiempo / estado</th>
            <th className="px-2 py-2 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={`${r.position}-${r.name}`} className="border-t">
              <td className="px-2 py-2">
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
              <td className="px-2 py-2 font-semibold">
                <span className="flex items-center gap-2">
                  <TeamStripe teamName={r.teamName} className="h-5" />
                  {r.name}
                </span>
              </td>
              <td className="hidden px-2 py-2 text-muted-foreground sm:table-cell">{r.teamName}</td>
              <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                {r.time || formatStatus(r.status)}
              </td>
              <td className="px-2 py-2 text-right font-display font-bold tabular-nums">
                {r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

export function GrandPrixPage() {
  const { gp, results, weather } = route.useLoaderData();
  const finished = gp.status === "finalizado";
  const raceStart = gp.sessions.find((s) => s.name === "Carrera")?.start;

  return (
    <>
      <Link
        to="/calendario"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al calendario
      </Link>

      <PageHeader title={gp.name} subtitle={`${gp.circuit} · ${gp.country}`} />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge status={gp.status} />
        <span className="text-muted-foreground">
          Ronda {gp.round} ·{" "}
          {formatDate(gp.date, { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <div className="h-64 text-primary">
              <CircuitMap lat={gp.lat} lng={gp.lng} label={gp.circuit} />
            </div>
          </section>
          <CircuitFacts circuitId={gp.circuitId} circuitName={gp.circuit} />
        </div>

        <div className="space-y-6">
          {finished ? (
            <section className="space-y-3 rounded-2xl border bg-card p-5">
              <h2 className="text-xl font-bold uppercase">Clasificación de la carrera</h2>
              <ResultsTable results={results} />
            </section>
          ) : (
            <>
              <section className="space-y-3 rounded-2xl border bg-card p-5">
                <h2 className="text-xl font-bold uppercase">Horarios</h2>
                <SessionsList sessions={gp.sessions} />
              </section>
              <WeatherCard weather={weather} raceStart={raceStart} fallbackDate={gp.date} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Crown, Lock } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { DriverAvatar } from "@/components/DriverAvatar";
import type { useDriverOfTheDay } from "@/hooks/useDriverOfTheDay";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { useNow } from "@/hooks/useNow";
import { formatRemaining } from "@/lib/countdown";
import type { RaceResult } from "@/lib/f1";
import type { Driver, GrandPrix } from "@/lib/types";

type DotdState = ReturnType<typeof useDriverOfTheDay>;

const HOUR = 3_600_000;
const OPENS_AFTER = 3 * HOUR; // la votación abre 3 horas después de la largada
const CLOSES_AFTER = 72 * HOUR; // y cierra a las 72 horas

const BUTTON_PRIMARY =
  "mt-4 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95";
const BUTTON_OUTLINE =
  "mt-4 inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:bg-accent/40 active:scale-95";
const BUTTON_GHOST = "mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline";

// Lleva a la página de la carrera, directo a la parte del Piloto del día.
function GoLink({ round, className, children }: { round: number; className: string; children: ReactNode }) {
  return (
    <Link to="/gp/$round" params={{ round: String(round) }} hash="piloto-del-dia" className={className}>
      {children}
    </Link>
  );
}

export function DriverOfTheDaySection({
  gp,
  results,
  drivers,
  dotd,
}: {
  gp: GrandPrix;
  results: RaceResult[];
  drivers: Driver[];
  dotd: DotdState;
}) {
  const now = useNow(30_000);

  const top = results.slice(0, 5);
  const winner = dotd.status === "closed" ? dotd.tally[0] : undefined;
  const wikiById = new Map(drivers.map((driver) => [driver.id, driver.wikiUrl ?? null]));
  const photoIds = [...new Set([...top.map((r) => r.driverId), ...(winner ? [winner.driver_id] : [])])];
  const photos = useDriverPhotos(photoIds.map((id) => ({ id, wikiUrl: wikiById.get(id) ?? null })));

  if (dotd.loading) {
    return (
      <section className="mt-10">
        <div className="skeleton h-44 w-full" />
      </section>
    );
  }
  if (dotd.error) return null;

  const raceStart = gp.sessions.find((session) => session.name === "Carrera")?.start;
  const raceMs = raceStart ? Date.parse(raceStart) : null;
  const opensAt = raceMs === null ? null : raceMs + OPENS_AFTER;
  const closesAt = raceMs === null ? null : raceMs + CLOSES_AFTER;

  const nameOf = (id: string) =>
    results.find((r) => r.driverId === id)?.name ?? drivers.find((d) => d.id === id)?.name ?? id;
  const percentOf = (votes: number) => (dotd.totalVotes > 0 ? Math.round((votes * 100) / dotd.totalVotes) : 0);

  let card: ReactNode;

  if (dotd.status === "open") {
    const voted = dotd.myVote !== null;
    const closesIn = closesAt !== null && now !== null ? formatRemaining(closesAt - now) : null;

    card = (
      <div className="relative overflow-hidden rounded-2xl border border-primary/60 bg-hero p-5 shadow-glow md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Votación abierta
          </span>
          {closesIn && <span className="text-xs text-muted-foreground">Cierra en {closesIn}</span>}
        </div>

        <p className="mt-3 font-display text-3xl font-bold uppercase md:text-4xl">
          {voted ? "¡Gracias por votar!" : "¿Quién fue el mejor?"}
        </p>
        <p className="text-sm text-muted-foreground">{gp.name}</p>

        {voted ? (
          <div className="mt-4 space-y-3">
            <p className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Votaste por <span className="font-semibold">{nameOf(dotd.myVote ?? "")}</span>
            </p>
            <ul className="space-y-2">
              {dotd.tally.slice(0, 3).map((entry) => (
                <li key={entry.driver_id} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">{nameOf(entry.driver_id)}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{percentOf(entry.votes)}%</span>
                  </div>
                  <AnimatedBar percent={percentOf(entry.votes)} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="mt-4 flex -space-x-3">
            {top.map((r) => (
              <li
                key={r.driverId}
                className="rounded-full ring-2 ring-background transition-transform hover:-translate-y-1"
              >
                <DriverAvatar name={r.name} photo={photos[r.driverId] ?? null} size="lg" />
              </li>
            ))}
          </ul>
        )}

        <GoLink round={gp.round} className={voted ? BUTTON_OUTLINE : BUTTON_PRIMARY}>
          {voted ? "Ver resultados o cambiar mi voto →" : dotd.userId ? "Votar ahora →" : "Ver la votación →"}
        </GoLink>
      </div>
    );
  } else if (dotd.status === "closed") {
    card = (
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-card p-5 md:p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Crown className="h-3.5 w-3.5" />
          Votación cerrada
        </span>

        {winner ? (
          <div className="mt-4 flex items-center gap-4">
            <span className="rounded-full ring-2 ring-amber-400">
              <DriverAvatar name={nameOf(winner.driver_id)} photo={photos[winner.driver_id] ?? null} size="xl" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Piloto del día · {gp.name}</p>
              <p className="gold-text font-display text-3xl font-bold uppercase md:text-4xl">
                {nameOf(winner.driver_id)}
              </p>
              <p className="text-sm text-muted-foreground">
                {winner.votes} {winner.votes === 1 ? "voto" : "votos"} · {percentOf(winner.votes)}%
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Nadie votó en {gp.name}.</p>
        )}

        <GoLink round={gp.round} className={BUTTON_OUTLINE}>
          Ver resultados →
        </GoLink>
      </div>
    );
  } else {
    const opensIn = opensAt !== null && now !== null && opensAt > now ? formatRemaining(opensAt - now) : null;

    card = (
      <div className="rounded-2xl border border-dashed bg-card/40 p-5 md:p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Próximamente
        </span>
        <p className="mt-3 font-display text-2xl font-bold uppercase text-muted-foreground">
          La votación todavía no abrió
        </p>
        <p className="text-sm text-muted-foreground">
          {opensIn
            ? `Abre en ${opensIn}, 3 horas después de la largada de ${gp.name}.`
            : `Abre unas horas después de que termine ${gp.name}.`}
        </p>
        <GoLink round={gp.round} className={BUTTON_GHOST}>
          Ver la carrera →
        </GoLink>
      </div>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-2xl font-bold uppercase">Piloto del día</h2>
      {card}
    </section>
  );
}
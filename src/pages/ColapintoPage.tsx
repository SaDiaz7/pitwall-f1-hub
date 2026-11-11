import { useState, type CSSProperties } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowRight, Check, Share2 } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { ColapintoNews } from "@/components/ColapintoNews";
import { ColapintoWallpapers } from "@/components/ColapintoWallpapers";
import { Countdown } from "@/components/Countdown";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverComparison } from "@/components/DriverComparison";
import { DriverSeasonResults } from "@/components/DriverSeasonResults";
import { PageHeader } from "@/components/PageHeader";
import { TeamStripe } from "@/components/TeamStripe";
import { TeammateDuel } from "@/components/TeammateDuel";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { useSession } from "@/hooks/useSession";
import { getTeamColor } from "@/lib/team-colors";
import type { GrandPrix } from "@/lib/types";

const route = getRouteApi("/_privado/colapinto");

const CELESTE = "#74acdf";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function ageFrom(dateOfBirth: string): number {
  const born = new Date(`${dateOfBirth}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - born.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
}

const show = (n: number | null | undefined) => (n === null || n === undefined ? "—" : String(n));

function StatCard({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <div
      className="fade-up rounded-2xl border bg-card/80 p-4 backdrop-blur"
      style={{ "--i": index + 2 } as CSSProperties}
    >
      <p className="font-display text-3xl font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Zona Colapinto · PitWall", text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Si la persona cierra el menú de compartir no es un error.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Compartir:", error);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:border-primary/50 hover:text-primary active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copiado" : "Compartir"}
    </button>
  );
}

function NextRaceCard({ gp }: { gp: GrandPrix }) {
  const raceStart = gp.sessions.find((session) => session.name === "Carrera")?.start;

  return (
    <section className="fade-up rounded-2xl border bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Próxima carrera · Ronda {gp.round}</p>
      <h2 className="mt-1 font-display text-3xl font-bold uppercase leading-tight">{gp.name}</h2>
      <p className="text-sm text-muted-foreground">
        {gp.circuit} · {gp.country}
      </p>

      {raceStart && (
        <div className="mt-4">
          <p className="mb-1 text-xs text-muted-foreground">Largada en</p>
          <Countdown target={raceStart} />
        </div>
      )}

      <Link
        to="/gp/$round"
        params={{ round: String(gp.round) }}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        Ver horarios y detalles <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

export function ColapintoPage() {
  const { drivers, driverId, position, detail, next } = route.useLoaderData();
  const { session } = useSession();

  const current = position === null ? null : (drivers[position - 1] ?? null);
  const profile = detail?.profile ?? null;
  const name = current?.name ?? profile?.name ?? "Franco Colapinto";
  const number = current?.number ?? profile?.number ?? null;
  const teamName = current?.teamName;
  const color = current ? getTeamColor(current.teamId, current.teamName) : CELESTE;
  const leaderPoints = drivers[0]?.points ?? 0;
  const mate = current ? drivers.find((d) => d.teamId === current.teamId && d.id !== current.id) : undefined;

  const photos = useDriverPhotos([{ id: driverId, wikiUrl: current?.wikiUrl ?? profile?.wikiUrl ?? undefined }]);
  const photo = photos[driverId] ?? null;

  const totals = detail?.totals;
  const born = profile ? new Date(`${profile.dateOfBirth}T00:00:00Z`) : null;

  return (
    <>
      <PageHeader
        title="Zona Colapinto"
        subtitle="Todo sobre Franco: resultados, próxima carrera, noticias y fondos."
      />

      <section
        className="fade-up relative mb-6 overflow-hidden rounded-3xl border p-5 md:p-8"
        style={{
          borderColor: color,
          backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${color} 32%, transparent), transparent 65%)`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${CELESTE} 0 33.3%, #ffffff 33.3% 66.6%, ${CELESTE} 66.6%)`,
          }}
        />
        {number !== null && number > 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-6 right-2 select-none font-display text-[9rem] font-bold leading-none opacity-10 md:text-[12rem]"
          >
            {number}
          </span>
        )}

        <div className="relative flex flex-wrap items-center gap-4 md:gap-6">
          <DriverAvatar name={name} photo={photo} size="xl" zoom />
          <div className="min-w-0 flex-1">
            {number !== null && number > 0 && (
              <p className="font-display text-5xl font-bold leading-none text-primary">{number}</p>
            )}
            <h2 className="font-display text-3xl font-bold uppercase leading-tight md:text-5xl">{name}</h2>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {current && <TeamStripe teamId={current.teamId} teamName={teamName} className="h-4" />}
              {[teamName, "Argentino"].filter(Boolean).join(" · ")}
            </p>
            {born && profile && (
              <p className="text-sm text-muted-foreground">
                Nació el {dateFormatter.format(born)} ({ageFrom(profile.dateOfBirth)} años)
              </p>
            )}
          </div>
          <ShareButton text="Seguí a Franco Colapinto en PitWall: resultados, próxima carrera, noticias y fondos." />
        </div>

        {current && position !== null ? (
          <>
            <div className="relative mt-6 grid grid-cols-3 gap-3">
              <StatCard index={0} label="Posición" value={`P${position}`} />
              <StatCard index={1} label="Puntos" value={String(current.points)} />
              <StatCard index={2} label="Victorias" value={String(current.wins)} />
            </div>
            <div className="relative mt-4 space-y-1.5">
              <AnimatedBar
                percent={leaderPoints > 0 ? Math.round((current.points / leaderPoints) * 100) : 0}
                color={color}
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                {position === 1 ? "Líder del campeonato" : `A ${leaderPoints - current.points} pts del líder`}
              </p>
            </div>
          </>
        ) : (
          <p className="relative mt-6 text-sm text-muted-foreground">
            Todavía no tiene resultados en esta temporada.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-x-6 gap-y-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-6">
          {next && <NextRaceCard gp={next} />}

          {current && drivers.length >= 2 && (
            <section className="fade-up space-y-3" style={{ "--i": 1 } as CSSProperties}>
              <h2 className="text-xl font-bold uppercase">{mate ? "Cara a cara con su compañero" : "Cara a cara"}</h2>
              <DriverComparison
                drivers={drivers}
                initialAId={current.id}
                initialBId={mate?.id ?? (position === 1 ? drivers[1]?.id : drivers[0]?.id)}
              />
              {mate && (
                <TeammateDuel
                  driver={current}
                  mate={mate}
                  colorA={color}
                  colorB={getTeamColor(mate.teamId, mate.teamName)}
                />
              )}
            </section>
          )}

          {totals && (
            <section className="fade-up space-y-3" style={{ "--i": 2 } as CSSProperties}>
              <h2 className="text-xl font-bold uppercase">Su carrera en la F1</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard index={0} label="Grandes Premios" value={show(totals.starts)} />
                <StatCard index={1} label="Podios" value={show(totals.podiums)} />
                <StatCard index={2} label="Victorias" value={show(totals.wins)} />
                <StatCard
                  index={3}
                  label="Temporadas"
                  value={detail && detail.seasons.length > 0 ? String(detail.seasons.length) : "—"}
                />
              </div>
            </section>
          )}
        </div>

        {current && <DriverSeasonResults driverId={driverId} color={color} />}
      </div>

      <div className="mt-8 space-y-8">
        <ColapintoNews />
        <ColapintoWallpapers driverId={driverId} />

        <section className="fade-up relative overflow-hidden rounded-2xl border border-primary/40 bg-hero p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Sumate a PitWall</p>
          <h2 className="mt-1 font-display text-3xl font-bold uppercase md:text-4xl">¿Puntúa Franco este domingo?</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Armá tu top 10 de la próxima carrera, sumá puntos extra si acertás que Franco puntúa, y competí con tus
            amigos en el ranking y en las ligas.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={session ? "/predicciones" : "/registro"}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              {session ? "Hacer mi predicción" : "Crear mi cuenta gratis"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/juego"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:bg-accent/40 active:scale-95"
            >
              Jugar “Adiviná el circuito”
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
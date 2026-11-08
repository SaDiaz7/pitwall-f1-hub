import { useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ChevronRight, MapPin } from "lucide-react";
import { CircuitMap } from "@/components/CircuitMap";
import { Countdown } from "@/components/Countdown";
import { PageHeader } from "@/components/PageHeader";
import { navItems } from "@/components/AppShell";
import { WallpaperModal } from "@/components/WallpaperModal";
import { useFavorites } from "@/hooks/useFavorites";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useWallpapers } from "@/hooks/useWallpapers";
import type { RaceResult } from "@/lib/f1";
import { formatDate } from "@/lib/format";
import type { Driver, GrandPrix } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getWallpaperUrls, qualityLabel, type Wallpaper } from "@/lib/wallpapers";
import { DriverAvatar } from "@/components/DriverAvatar";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { getTeamColor } from "@/lib/team-colors";
import { TeamStripe } from "@/components/TeamStripe";
import { ChampionBanner } from "@/components/ChampionBanner";
import { HeroCarousel } from "@/components/HeroCarousel";
import { DailyGameCard } from "@/components/DailyGameCard";
import { PredictionCard } from "@/components/PredictionCard";
import { PredictionStats } from "@/components/PredictionStats";
import { usePredictions } from "@/hooks/usePredictions";
import { seasonOf } from "@/lib/predictions";
import { RankingPreview } from "@/components/RankingPreview";

import { DailyGameRankingCard } from "@/components/DailyGameRankingCard";
import { DriverOfTheDayCard } from "@/components/DriverOfTheDayCard";
import { useNow } from "@/hooks/useNow";
import { useDriverOfTheDay } from "@/hooks/useDriverOfTheDay";

import { DriverOfTheDaySection } from "@/components/DriverOfTheDaySection";
import { TopFiveCard } from "@/components/TopFiveCard";
import { WeekendCard } from "@/components/WeekendCard";
import { LiveBanner } from "@/components/LiveBanner";
import { NewToF1Card } from "@/components/NewToF1Card";
import { GuestFeatures } from "@/components/GuestFeatures";
import { useSession } from "@/hooks/useSession";

const route = getRouteApi("/_privado/inicio");

const MAX_WALLPAPERS = 6;

function LastRace({ gp, results }: { gp: GrandPrix; results: RaceResult[] }) {
  const podium = results.slice(0, 3);
  const fastest = results.find((r) => r.fastestLapTime !== null);

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Última carrera</h2>
        <Link
          to="/gp/$round"
          params={{ round: String(gp.round) }}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Ver clasificación completa
        </Link>
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <div>
          <p className="text-xs text-muted-foreground">
            Ronda {gp.round} · {formatDate(gp.date, { day: "numeric", month: "long" })}
          </p>
          <p className="font-display text-xl font-bold uppercase">{gp.name}</p>
        </div>

        {podium.length === 0 ? (
          <p className="text-sm text-muted-foreground">Resultados no disponibles por el momento.</p>
        ) : (
          <ol className="space-y-1.5">
            {podium.map((entry) => (
              <li key={entry.position} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold",
                    entry.position === 1 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
                  )}
                >
                  {entry.position}
                </span>
          <TeamStripe teamName={entry.teamName} className="h-5" />
          <span className="min-w-0 flex-1 truncate font-semibold">{entry.name}</span>                
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">{entry.teamName}</span>
              </li>
            ))}
          </ol>
        )}

        {fastest && (
          <p className="text-sm text-muted-foreground">
            Vuelta rápida: <span className="font-semibold text-foreground">{fastest.name}</span> (
            {fastest.fastestLapTime})
          </p>
        )}
      </div>
    </section>
  );
}

// Resultados de pilotos Fav

const NOT_FINISHED: Record<string, string> = {
  R: "Abandonó",
  D: "Descalificado",
  W: "Se retiró",
  E: "Excluido",
  F: "No clasificó",
  N: "No clasificado",
};

function LastRaceResult({ result }: { result: RaceResult | undefined }) {
  if (!result) return null;

  const finished = /^\d+$/.test(result.positionText);
  const fromPits = result.grid === 0;
  const change = finished && !fromPits ? result.grid - result.position : 0;

  return (
    <div className="mt-3 border-t pt-2 text-xs">
      <p className="text-muted-foreground">Última carrera</p>
      <p className="mt-0.5 flex items-center gap-1.5 font-semibold">
        <span>
          {fromPits ? "Boxes" : `P${result.grid}`} →{" "}
          {finished ? (
            `P${result.position}`
          ) : (
            <span className="text-red-400">{NOT_FINISHED[result.positionText] ?? "No terminó"}</span>
          )}
        </span>
        {change > 0 && <span className="text-emerald-400">▲{change}</span>}
        {change < 0 && <span className="text-red-400">▼{Math.abs(change)}</span>}
        <span className="ml-auto font-normal text-muted-foreground">+{result.points} pts</span>
      </p>
    </div>
  );
}

function MyDrivers({ drivers, results }: { drivers: Driver[]; results: RaceResult[] }) {
  const { favorites, loading } = useFavorites();
  const leaderPoints = drivers[0]?.points ?? 0;

  // Solo pilotos que corren esta temporada, en el orden del campeonato.
  const mine = drivers
    .map((driver, index) => ({ driver, position: index + 1 }))
    .filter(({ driver }) => favorites.includes(driver.id));

  const photos = useDriverPhotos(mine.map(({ driver }) => ({ id: driver.id, wikiUrl: driver.wikiUrl })));

  if (loading || mine.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Tus pilotos</h2>
        <Link to="/favoritos" className="text-sm font-semibold text-primary hover:underline">
          Ver favoritos
        </Link>
      </div>

      <ul className="flex gap-3 overflow-x-auto pb-3 pt-1">
        {mine.map(({ driver, position }) => (
          <li key={driver.id} className="min-w-60 shrink-0">
            <Link
              to="/piloto/$id"
              params={{ id: driver.id }}
              style={{ borderLeftColor: getTeamColor(driver.teamId, driver.teamName) }}
              className="card-link block rounded-2xl border border-l-4 bg-card p-4 hover:bg-accent/40"
            >
              <div className="flex items-center gap-3">
                <DriverAvatar name={driver.name} photo={photos[driver.id] ?? null} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{driver.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{driver.teamName}</p>
                </div>
                <span className="font-display text-2xl font-bold text-muted-foreground">{driver.number}</span>
              </div>
              <p className="mt-3 text-sm">
                <span className="font-display text-xl font-bold">P{position}</span>{" "}
                <span className="text-muted-foreground">· {driver.points} pts</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {position === 1 ? "Líder del campeonato" : `A ${leaderPoints - driver.points} pts del líder`}
              </p>
              <LastRaceResult result={results.find((r) => r.driverId === driver.id)} />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Fotos: Wikipedia/Wikimedia Commons.</p>
    </section>
  );
}


function FavoriteWallpapers() {
  const isAdmin = useIsAdmin();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const { wallpapers, loading: wallpapersLoading, reload } = useWallpapers();
  const [selected, setSelected] = useState<Wallpaper | null>(null);

  const mine = wallpapers.filter((w) => w.driver_id !== null && favorites.includes(w.driver_id));
  const shown = mine.slice(0, MAX_WALLPAPERS);

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Fondos de tus pilotos</h2>
        <Link to="/fondos" className="text-sm font-semibold text-primary hover:underline">
          Ver todos los fondos
        </Link>
      </div>

      {favoritesLoading || wallpapersLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no elegiste pilotos favoritos. Entrá al{" "}
          <Link to="/campeonato" className="font-semibold text-primary hover:underline">
            campeonato
          </Link>{" "}
          y tocá la estrella al lado de tus pilotos para ver acá sus fondos de pantalla.
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay fondos de tus pilotos favoritos. Mirá todos los que hay en{" "}
          <Link to="/fondos" className="font-semibold text-primary hover:underline">
            Fondos
          </Link>
          .
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {shown.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => setSelected(w)}
                className="card-link group relative block w-full overflow-hidden rounded-2xl border bg-card text-left"
              >
                <img
                  src={getWallpaperUrls(w.id).thumb}
                  alt={w.driver_name ?? w.team_name ?? "Fondo"}
                  loading="lazy"
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-bold backdrop-blur">
                  {qualityLabel(w.quality)}
                </span>
                <div className="flex items-center gap-2 p-3">
                  <TeamStripe teamId={w.team_id} teamName={w.team_name} className="h-8" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{w.driver_name ?? w.team_name ?? "Fondo"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[w.driver_name ? w.team_name : null, w.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <WallpaperModal
          wallpaper={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </section>
  );
}

export function HomePage() {
  const { grandsPrix, lastResults, drivers } = route.useLoaderData();
  const next = grandsPrix.find((gp) => gp.status === "proximo");
  const last = [...grandsPrix].reverse().find((gp) => gp.status === "finalizado");
  const raceStart = next?.sessions.find((s) => s.name === "Carrera")?.start;
  const season = next ? seasonOf(next) : new Date().getFullYear();
  const { events, predictions, loading: predictionsLoading } = usePredictions(season);
  const nextEvent = next ? events[next.round] : undefined;
  const { session, loading: sessionLoading } = useSession();
  // El Piloto del día es el de la carrera de este fin de semana apenas abre la votación
  // (75 minutos después de la largada); antes de eso, el de la última carrera.
  const clock = useNow(30_000);
  const nextRaceMs = raceStart ? Date.parse(raceStart) : null;
  const dotdGp = next && clock !== null && nextRaceMs !== null && clock >= nextRaceMs + 75 * 60_000 ? next : last;
  const dotdResults: RaceResult[] = dotdGp === last ? lastResults : [];
  const dotd = useDriverOfTheDay(dotdGp ? seasonOf(dotdGp) : season, dotdGp?.round ?? 0);

  return (
    <>
      <PageHeader title="Inicio" subtitle="Tu resumen de la temporada." />

      <HeroCarousel
        slides={[
          {
            key: "champion",
            glow: "shadow-[0_0_50px_-10px_rgba(251,191,36,0.55)]",
            content: <ChampionBanner />,
          },
          ...(next
            ? [
                {
                  key: "next",
                  glow: "shadow-glow",
                  content: (
                    <section className="relative h-full overflow-hidden rounded-2xl border bg-hero p-6 md:p-8">
                      <div className="grid items-center gap-6 md:grid-cols-[1fr_16rem]">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-primary">
                            Próxima carrera · Ronda {next.round}
                          </p>
                          <Link
                            to="/gp/$round"
                            params={{ round: String(next.round) }}
                            className="hover:text-primary"
                          >
                            <h2 className="mt-2 text-4xl font-bold uppercase italic md:text-6xl">
                              {next.name}
                            </h2>
                          </Link>
                          <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" /> {next.circuit}, {next.country}
                          </p>
                          <p className="mt-1 font-display text-2xl font-semibold capitalize">
                            {formatDate(next.date, {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          {raceStart && (
                            <div className="mt-4">
                              <Countdown target={raceStart} />
                            </div>
                          )}
                          <Link
                            to="/gp/$round"
                            params={{ round: String(next.round) }}
                            className="mt-4 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
                          >
                            Ver horarios y más detalles →
                          </Link>
                        </div>
                        <div className="h-36 text-primary md:h-44">
                          <CircuitMap lat={next.lat} lng={next.lng} label={next.circuit} />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
                    </section>
                  ),
                },
              ]
            : []),
          {
            key: "daily-game",
            glow: "shadow-glow",
            content: <DailyGameCard />,
          },
          ...(dotdGp && dotd.status === "open" && !dotd.loading
            ? [
                {
                  key: "driver-of-the-day",
                  glow: "shadow-[0_0_50px_-10px_rgba(251,191,36,0.55)]",
                  content: (
                    <DriverOfTheDayCard gp={dotdGp} results={dotdResults} drivers={drivers} myVote={dotd.myVote} />
                  ),
                },
              ]
            : []),
          ...(session && next && nextEvent && !predictionsLoading
            ? [
                {
                  key: "predictions",
                  glow: "shadow-glow",
                  content: (
                    <PredictionCard
                      gp={next}
                      event={nextEvent}
                      prediction={predictions[next.round]}
                      drivers={drivers}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />

      {next && <LiveBanner gp={next} className="mt-10" />}

      <NewToF1Card className="mt-10" />

      {dotdGp && <DriverOfTheDaySection gp={dotdGp} results={dotdResults} drivers={drivers} dotd={dotd} />}

      {(drivers.length > 0 || next) && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {drivers.length > 0 && <TopFiveCard drivers={drivers} linked={Boolean(session)} />}
          {next && <WeekendCard gp={next} />}
        </div>
      )}
      


      {!sessionLoading && !session && <GuestFeatures />}

      {session && !predictionsLoading && <PredictionStats events={events} predictions={predictions} />}
      
      <div className={cn("grid gap-x-6", session && "md:grid-cols-2")}>
        {session && <RankingPreview season={season} />}
        <DailyGameRankingCard />
      </div>

      {session && <MyDrivers drivers={drivers} results={lastResults} />}

      {session && <FavoriteWallpapers />}
      

      <section className={cn("lg:hidden", !session && "hidden")}>
        <h2 className="mb-3 mt-10 text-2xl font-bold uppercase">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {navItems.slice(1).map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="card-link flex items-center gap-3 rounded-2xl border bg-card p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 font-semibold">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

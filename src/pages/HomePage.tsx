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

const route = getRouteApi("/_privado/inicio");

const MAX_WALLPAPERS = 6;

function MyDrivers({ drivers }: { drivers: Driver[] }) {
  const { favorites, loading } = useFavorites();
  const leaderPoints = drivers[0]?.points ?? 0;

  // Solo pilotos que corren esta temporada, en el orden del campeonato.
  const mine = drivers
    .map((driver, index) => ({ driver, position: index + 1 }))
    .filter(({ driver }) => favorites.includes(driver.id));

  if (loading || mine.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Tus pilotos</h2>
        <Link to="/favoritos" className="text-sm font-semibold text-primary hover:underline">
          Ver favoritos
        </Link>
      </div>

      <ul className="flex gap-3 overflow-x-auto pb-2">
        {mine.map(({ driver, position }) => (
          <li key={driver.id} className="min-w-52 shrink-0 rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-3xl font-bold leading-none">{driver.number}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{driver.name}</p>
                <p className="truncate text-xs text-muted-foreground">{driver.teamName}</p>
              </div>
            </div>
            <p className="mt-3 text-sm">
              <span className="font-display text-xl font-bold">P{position}</span>{" "}
              <span className="text-muted-foreground">· {driver.points} pts</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {position === 1 ? "Líder del campeonato" : `A ${leaderPoints - driver.points} pts del líder`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
                className="group relative block w-full overflow-hidden rounded-2xl border bg-card text-left"
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
                <div className="p-3">
                  <p className="truncate font-semibold">{w.driver_name ?? w.team_name ?? "Fondo"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[w.driver_name ? w.team_name : null, w.year].filter(Boolean).join(" · ")}
                  </p>
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

  return (
    <>
      <PageHeader title="Inicio" subtitle="Tu resumen de la temporada." />

      {next && (
        <section className="relative overflow-hidden rounded-2xl border bg-hero p-6 shadow-glow md:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_16rem]">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Próxima carrera · Ronda {next.round}
              </p>
              <Link to="/gp/$round" params={{ round: String(next.round) }} className="hover:text-primary">
                <h2 className="mt-2 text-4xl font-bold uppercase italic md:text-6xl">{next.name}</h2>
              </Link>
              <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {next.circuit}, {next.country}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold capitalize">
                {formatDate(next.date, { weekday: "long", day: "numeric", month: "long" })}
              </p>
              {raceStart && (
                <div className="mt-4">
                  <Countdown target={raceStart} />
                </div>
              )}
              <Link
                to="/gp/$round"
                params={{ round: String(next.round) }}
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Ver detalle →
              </Link>
            </div>
            <div className="h-36 text-primary md:h-44">
              <CircuitMap lat={next.lat} lng={next.lng} label={next.circuit} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
        </section>
      )}

      <MyDrivers drivers={drivers} />

      {last && <LastRace gp={last} results={lastResults} />}

      <FavoriteWallpapers />

      <h2 className="mb-3 mt-10 text-2xl font-bold uppercase">Accesos rápidos</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.slice(1).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1 font-semibold">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </>
  );
}

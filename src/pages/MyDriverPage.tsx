import type { CSSProperties } from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverComparison } from "@/components/DriverComparison";
import { DriverSeasonResults } from "@/components/DriverSeasonResults";
import { TeamStripe } from "@/components/TeamStripe";
import { TeammateDuel } from "@/components/TeammateDuel";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { useFavorites } from "@/hooks/useFavorites";
import { getTeamColor } from "@/lib/team-colors";
import type { Driver } from "@/lib/types";
import { cn } from "@/lib/utils";

const route = getRouteApi("/_privado/mi-piloto");

interface Entry {
  driver: Driver;
  position: number;
}

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

function PageLoading() {
  return (
    <>
      <div className="skeleton mb-4 h-9 w-full max-w-md" />
      <div className="skeleton mb-6 h-56 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
    </>
  );
}

export function MyDriverPage() {
  const { drivers } = route.useLoaderData();
  const { piloto } = route.useSearch();
  const navigate = useNavigate({ from: "/mi-piloto" });
  const { favorites, loading } = useFavorites();

  // La posición es el lugar en la tabla del campeonato.
  const entries: Entry[] = drivers.map((driver, index) => ({ driver, position: index + 1 }));
  const favoriteEntries = entries.filter(({ driver }) => favorites.includes(driver.id));
  const hasFavorites = favoriteEntries.length > 0;

  // Prioridad: el de la dirección, después tu primer favorito, después el líder.
  const selected = entries.find((e) => e.driver.id === piloto) ?? favoriteEntries[0] ?? entries[0];

  const photoTargets = [
    ...new Map(
      [selected, ...favoriteEntries]
        .filter((e): e is Entry => e !== undefined)
        .map((e) => [e.driver.id, e]),
    ).values(),
  ];
  const photos = useDriverPhotos(
    photoTargets.map(({ driver }) => ({ id: driver.id, wikiUrl: driver.wikiUrl })),
  );

  const choose = (id: string) => {
    void navigate({ search: { piloto: id } });
  };

  if (loading) return <PageLoading />;

  if (!selected) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Todavía no hay pilotos para mostrar en esta temporada.
      </div>
    );
  }

  const { driver, position } = selected;
  const color = getTeamColor(driver.teamId, driver.teamName);
  const photo = photos[driver.id] ?? null;
  const leaderPoints = drivers[0]?.points ?? 0;

  // Compañero de equipo; si no hay, se compara con el líder (o con el 2.º si es el líder).
  const mate = entries.find((e) => e.driver.teamId === driver.teamId && e.driver.id !== driver.id)?.driver;
  const rival = mate ?? (position === 1 ? entries[1]?.driver : entries[0]?.driver);

  return (
    <>
      <div>
        <h1 className="mb-3 font-display text-3xl font-bold uppercase md:text-4xl">Mi piloto</h1>

        {hasFavorites ? (
          <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {favoriteEntries.map((entry, i) => {
              const active = entry.driver.id === driver.id;
              return (
                <li
                  key={entry.driver.id}
                  className="fade-up shrink-0 snap-start"
                  style={{ "--i": i } as CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => choose(entry.driver.id)}
                    aria-pressed={active}
                    style={
                      active ? { borderColor: getTeamColor(entry.driver.teamId, entry.driver.teamName) } : undefined
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TeamStripe teamId={entry.driver.teamId} teamName={entry.driver.teamName} className="h-4" />
                    {entry.driver.name}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="space-y-2">
            <select
              value={driver.id}
              onChange={(e) => choose(e.target.value)}
              aria-label="Elegí un piloto"
              className="h-10 w-full max-w-sm rounded-md border bg-card px-3 text-sm"
            >
              {entries.map((e) => (
                <option key={e.driver.id} value={e.driver.id}>
                  {e.driver.name}
                </option>
              ))}
            </select>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5" />
              Todavía no tenés favoritos. Marcalos con la estrella en el{" "}
              <Link to="/campeonato" className="font-semibold text-primary hover:underline">
                campeonato
              </Link>{" "}
              y te aparecen acá.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-x-6 gap-y-6 xl:grid-cols-2 [&>section]:my-0">
        <div className="min-w-0 space-y-6">
          <section
            key={driver.id}
            className="fade-up relative overflow-hidden rounded-3xl border p-5 md:p-8"
            style={{
              borderColor: color,
              backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${color} 32%, transparent), transparent 65%)`,
            }}
          >
            {driver.number > 0 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-6 right-2 select-none font-display text-[9rem] font-bold leading-none opacity-10 md:text-[12rem]"
              >
                {driver.number}
              </span>
            )}

            <div className="relative flex flex-wrap items-center gap-4 md:gap-6">
              <DriverAvatar name={driver.name} photo={photo} size="xl" zoom />
              <div className="min-w-0">
                {driver.number > 0 && (
                  <p className="font-display text-5xl font-bold leading-none text-primary">{driver.number}</p>
                )}
                <h2 className="font-display text-3xl font-bold uppercase leading-tight md:text-5xl">{driver.name}</h2>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TeamStripe teamId={driver.teamId} teamName={driver.teamName} className="h-4" />
                  {driver.teamName}
                </p>
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-3 gap-3">
              <StatCard index={0} label="Posición" value={`P${position}`} />
              <StatCard index={1} label="Puntos" value={String(driver.points)} />
              <StatCard index={2} label="Victorias" value={String(driver.wins)} />
            </div>

            <div className="relative mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <p>{position === 1 ? "Líder del campeonato" : `A ${leaderPoints - driver.points} pts del líder`}</p>
              {photo && (
                <p className="text-xs">
                  Foto:{" "}
                  <a href={photo.page} target="_blank" rel="noopener noreferrer" className="underline">
                    Wikipedia
                  </a>
                </p>
              )}
            </div>
          </section>

          {drivers.length >= 2 && (
            <section
              key={`vs-${driver.id}`}
              className="fade-up space-y-3"
              style={{ "--i": 2 } as CSSProperties}
            >
              <h2 className="text-xl font-bold uppercase">{mate ? "Cara a cara con su compañero" : "Cara a cara"}</h2>
              <DriverComparison drivers={drivers} initialAId={driver.id} initialBId={rival?.id} />
              {mate && (
                <TeammateDuel
                  driver={driver}
                  mate={mate}
                  colorA={color}
                  colorB={getTeamColor(mate.teamId, mate.teamName)}
                />
              )}
            </section>
          )}
        </div>

        <DriverSeasonResults key={driver.id} driverId={driver.id} color={color} />
      </div>

      <Link
        to="/piloto/$id"
        params={{ id: driver.id }}
        className="card-link mt-6 flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-sm font-semibold"
      >
        Ver la ficha completa de {driver.name}
        <ArrowRight className="h-4 w-4 text-primary" />
      </Link>
    </>
  );
}
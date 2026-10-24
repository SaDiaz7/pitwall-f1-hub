import { Link, getRouteApi } from "@tanstack/react-router";
import { DriverAvatar } from "@/components/DriverAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PageHeader } from "@/components/PageHeader";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { useFavoriteTeams } from "@/hooks/useFavoriteTeams";
import { useFavorites } from "@/hooks/useFavorites";
import { getTeamColor } from "@/lib/team-colors";

const route = getRouteApi("/_privado/favoritos");

export function FavoritesPage() {
  const { drivers, teams } = route.useLoaderData();
  const { favorites, loading, error, toggle } = useFavorites();
  const teamFavorites = useFavoriteTeams();

  // La API devuelve pilotos y equipos ya ordenados por posición en el campeonato.
  const favoriteDrivers = drivers
    .map((driver, index) => ({ ...driver, position: index + 1 }))
    .filter((driver) => favorites.includes(driver.id));

  const favoriteTeams = teams
    .map((team, index) => ({ ...team, position: index + 1 }))
    .filter((team) => teamFavorites.favorites.includes(team.id));

  const photos = useDriverPhotos(favoriteDrivers.map((d) => ({ id: d.id, wikiUrl: d.wikiUrl })));

  const isLoading = loading || teamFavorites.loading;
  const hasAny = favoriteDrivers.length > 0 || favoriteTeams.length > 0;
  const errorMessage = error ?? teamFavorites.error;

  return (
    <>
      <PageHeader title="Favoritos" subtitle="Los pilotos y equipos que seguís de cerca." />

      {errorMessage && (
        <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{errorMessage}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando tus favoritos…</p>
      ) : !hasAny ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no seguís a ningún piloto ni equipo. Entrá al{" "}
          <Link to="/campeonato" className="font-semibold text-primary hover:underline">
            campeonato
          </Link>{" "}
          y tocá la estrella al lado de tus favoritos.
        </div>
      ) : (
        <div className="space-y-8">
          {favoriteDrivers.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold uppercase">Pilotos</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {favoriteDrivers.map((driver) => (
                  <li
                    key={driver.id}
                    style={{ borderLeftColor: getTeamColor(driver.teamId, driver.teamName) }}
                    className="flex items-center gap-4 rounded-2xl border border-l-4 bg-card p-4"
                  >
                    <DriverAvatar name={driver.name} photo={photos[driver.id] ?? null} size="lg" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/piloto/$id"
                        params={{ id: driver.id }}
                        className="block truncate font-display text-xl font-bold uppercase hover:text-primary"
                      >
                        {driver.name}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">{driver.teamName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        #{driver.number} · P{driver.position} · {driver.points} pts · {driver.wins} victorias
                      </p>
                    </div>
                    <FavoriteButton active onToggle={() => toggle(driver.id)} label={driver.name} />
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Fotos: Wikipedia/Wikimedia Commons.</p>
            </section>
          )}

          {favoriteTeams.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold uppercase">Constructores</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {favoriteTeams.map((team) => (
                  <li
                    key={team.id}
                    style={{ borderLeftColor: getTeamColor(team.id, team.name) }}
                    className="flex items-center gap-4 rounded-2xl border border-l-4 bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-xl font-bold uppercase">{team.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        P{team.position} · {team.points} pts · {team.wins} victorias
                      </p>
                    </div>
                    <FavoriteButton active onToggle={() => teamFavorites.toggle(team.id)} label={team.name} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}

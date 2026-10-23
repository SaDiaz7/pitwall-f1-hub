import { Link, getRouteApi } from "@tanstack/react-router";
import { DriverAvatar } from "@/components/DriverAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PageHeader } from "@/components/PageHeader";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { useFavorites } from "@/hooks/useFavorites";
import { getTeamColor } from "@/lib/team-colors";

const route = getRouteApi("/_privado/favoritos");

export function FavoritesPage() {
  const drivers = route.useLoaderData();
  const { favorites, loading, error, toggle } = useFavorites();

  // La API devuelve los pilotos ya ordenados por posición en el campeonato.
  const favoriteDrivers = drivers
    .map((driver, index) => ({ ...driver, position: index + 1 }))
    .filter((driver) => favorites.includes(driver.id));

  const photos = useDriverPhotos(favoriteDrivers.map((d) => ({ id: d.id, wikiUrl: d.wikiUrl })));

  return (
    <>
      <PageHeader title="Favoritos" subtitle="Los pilotos que seguís de cerca." />

      {error && (
        <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando tus favoritos…</p>
      ) : favoriteDrivers.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no seguís a ningún piloto. Entrá al{" "}
          <Link to="/campeonato" className="font-semibold text-primary hover:underline">
            campeonato
          </Link>{" "}
          y tocá la estrella al lado de tus pilotos favoritos.
        </div>
      ) : (
        <>
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
          <p className="mt-3 text-xs text-muted-foreground">Fotos: Wikipedia/Wikimedia Commons.</p>
        </>
      )}
    </>
  );
}

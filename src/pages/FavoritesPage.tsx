import { Link, getRouteApi } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";

const route = getRouteApi("/_privado/favoritos");

export function FavoritesPage() {
  const drivers = route.useLoaderData();
  const { favorites, loading, error, toggle } = useFavorites();

  // La API devuelve los pilotos ya ordenados por posición en el campeonato.
  const favoriteDrivers = drivers
    .map((driver, index) => ({ ...driver, position: index + 1 }))
    .filter((driver) => favorites.includes(driver.id));

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
        <ul className="grid gap-3 sm:grid-cols-2">
          {favoriteDrivers.map((driver) => (
            <li key={driver.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
              <div className="w-12 shrink-0 text-center font-display text-3xl font-bold leading-none">
                {driver.number}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-bold uppercase">{driver.name}</p>
                <p className="truncate text-sm text-muted-foreground">{driver.teamName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  P{driver.position} · {driver.points} pts · {driver.wins} victorias
                </p>
              </div>
              <FavoriteButton active onToggle={() => toggle(driver.id)} label={driver.name} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TeamStripe } from "@/components/TeamStripe";
import { supabase } from "@/integrations/supabase/client";
import { getTeamColor } from "@/lib/team-colors";
import type { Driver, Team } from "@/lib/types";

interface FavoriteItem {
  kind: string;
  item_id: string;
}

// Si un favorito ya no está en la temporada actual (por ejemplo, un piloto retirado), se muestra su identificador legible.
const prettify = (id: string) =>
  id
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export function ProfileFavorites({
  userId,
  drivers,
  teams,
}: {
  userId: string;
  drivers: Driver[];
  teams: Team[];
}) {
  const [items, setItems] = useState<FavoriteItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc("get_profile_favorites", { p_user_id: userId }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Cargar favoritos del perfil:", error);
        setItems([]);
        return;
      }
      setItems(data ?? []);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (items === null || items.length === 0) return null;

  const driverNames = new Map(drivers.map((d) => [d.id, d.name]));
  const teamNames = new Map(teams.map((t) => [t.id, t.name]));

  const favoriteDrivers = items.filter((item) => item.kind === "driver");
  const favoriteTeams = items.filter((item) => item.kind === "team");

  return (
    <section className="mb-6 space-y-4 rounded-2xl border bg-card p-5">
      {favoriteDrivers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase">Pilotos favoritos</h2>
          <ul className="flex flex-wrap gap-2">
            {favoriteDrivers.map((item) => (
              <li key={item.item_id}>
                <Link
                  to="/piloto/$id"
                  params={{ id: item.item_id }}
                  className="inline-block rounded-full border bg-secondary px-3 py-1 text-sm font-semibold hover:border-primary/50"
                >
                  {driverNames.get(item.item_id) ?? prettify(item.item_id)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {favoriteTeams.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase">Equipos favoritos</h2>
          <ul className="flex flex-wrap gap-2">
            {favoriteTeams.map((item) => {
              const name = teamNames.get(item.item_id) ?? prettify(item.item_id);
              return (
                <li
                  key={item.item_id}
                  className="flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-sm font-semibold"
                  style={{ borderColor: getTeamColor(item.item_id, name) }}
                >
                  <TeamStripe teamId={item.item_id} teamName={name} className="h-4" />
                  {name}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
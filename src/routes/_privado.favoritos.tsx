import { createFileRoute } from "@tanstack/react-router";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { DataError } from "@/components/DataError";
import { getConstructorStandings, getDriverStandings } from "@/lib/f1";
import type { Team } from "@/lib/types";

export const Route = createFileRoute("/_privado/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — PitWall" },
      { name: "description", content: "Tus pilotos y equipos favoritos de la Fórmula 1." },
      { property: "og:title", content: "Favoritos — PitWall" },
      { property: "og:description", content: "Tus pilotos y equipos favoritos de la Fórmula 1." },
    ],
  }),
  loader: async () => {
    // Si fallan los equipos, los pilotos se muestran igual.
    const [drivers, teams] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings().catch((): Team[] => []),
    ]);
    return { drivers, teams };
  },
  errorComponent: DataError,
  component: FavoritesPage,
});
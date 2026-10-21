import { createFileRoute } from "@tanstack/react-router";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { DataError } from "@/components/DataError";
import { getDriverStandings } from "@/lib/f1";

export const Route = createFileRoute("/_privado/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — PitWall" },
      { name: "description", content: "Tus pilotos favoritos de la Fórmula 1." },
      { property: "og:title", content: "Favoritos — PitWall" },
      { property: "og:description", content: "Tus pilotos favoritos de la Fórmula 1." },
    ],
  }),
  loader: () => getDriverStandings(),
  errorComponent: DataError,
  component: FavoritesPage,
});

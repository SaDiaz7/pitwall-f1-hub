import { createFileRoute } from "@tanstack/react-router";
import { WallpapersPage } from "@/pages/WallpapersPage";

export const Route = createFileRoute("/_privado/fondos")({
  head: () => ({
    meta: [
      { title: "Fondos — PitWall" },
      { name: "description", content: "Fondos de pantalla de pilotos y equipos de la Fórmula 1." },
      { property: "og:title", content: "Fondos — PitWall" },
      {
        property: "og:description",
        content: "Fondos de pantalla de pilotos y equipos de la Fórmula 1.",
      },
    ],
  }),
  component: WallpapersPage,
});

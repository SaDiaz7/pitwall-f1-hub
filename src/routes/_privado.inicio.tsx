import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";

export const Route = createFileRoute("/_privado/inicio")({
  head: () => ({
    meta: [
      { title: "Inicio — PitWall" },
      { name: "description", content: "Resumen de la temporada y próxima carrera." },
      { property: "og:title", content: "Inicio — PitWall" },
      { property: "og:description", content: "Resumen de la temporada y próxima carrera." },
    ],
  }),
  component: HomePage,
});

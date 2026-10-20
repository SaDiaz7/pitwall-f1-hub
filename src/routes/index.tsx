import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PitWall — Tu muro de boxes de Fórmula 1" },
      { name: "description", content: "Calendario, resultados y campeonatos de la F1 para fans." },
      { property: "og:title", content: "PitWall — Tu muro de boxes de Fórmula 1" },
      { property: "og:description", content: "Calendario, resultados y campeonatos de la F1 para fans." },
    ],
  }),
  component: LandingPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { AnalysisPage } from "@/pages/AnalysisPage";

export const Route = createFileRoute("/_privado/analisis")({
  head: () => ({
    meta: [
      { title: "Análisis — PitWall" },
      { name: "description", content: "Gráficas de la temporada: puntos, posiciones y remontadas." },
      { property: "og:title", content: "Análisis — PitWall" },
      { property: "og:description", content: "Gráficas de la temporada: puntos, posiciones y remontadas." },
    ],
  }),
  component: AnalysisPage,
});
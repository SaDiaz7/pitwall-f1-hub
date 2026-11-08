import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/pages/GuidePage";

export const Route = createFileRoute("/_privado/guia")({
  head: () => ({
    meta: [
      { title: "Guía de la F1 para principiantes — PitWall" },
      {
        name: "description",
        content:
          "Todo lo que necesitás para entender la Fórmula 1: prácticas, clasificación, sprint, puntos, banderas, safety car y aerodinámica, explicado desde cero.",
      },
      { property: "og:title", content: "Guía de la F1 para principiantes — PitWall" },
      {
        property: "og:description",
        content: "Prácticas, clasificación, sprint, puntos, banderas, safety car y aerodinámica, explicado desde cero.",
      },
    ],
  }),
  component: GuidePage,
});
import { createFileRoute } from "@tanstack/react-router";
import { RankingPage } from "@/pages/RankingPage";

export const Route = createFileRoute("/_privado/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — PitWall" },
      { name: "description", content: "El ranking de predicciones de la comunidad." },
    ],
  }),
  component: RankingPage,
});
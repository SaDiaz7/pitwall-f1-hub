import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipPage } from "@/pages/ChampionshipPage";

export const Route = createFileRoute("/_privado/campeonato")({
  head: () => ({
    meta: [
      { title: "Campeonato — PitWall" },
      { name: "description", content: "Tablas de pilotos y constructores." },
      { property: "og:title", content: "Campeonato — PitWall" },
      { property: "og:description", content: "Tablas de pilotos y constructores." },
    ],
  }),
  component: ChampionshipPage,
});

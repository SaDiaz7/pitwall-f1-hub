import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipPage } from "@/pages/ChampionshipPage";
import { DataError } from "@/components/DataError";
import { getConstructorStandings, getDriverStandings } from "@/lib/f1";

export const Route = createFileRoute("/_privado/campeonato")({
  head: () => ({
    meta: [
      { title: "Campeonato — PitWall" },
      { name: "description", content: "Tablas de pilotos y constructores." },
      { property: "og:title", content: "Campeonato — PitWall" },
      { property: "og:description", content: "Tablas de pilotos y constructores." },
    ],
  }),
  loader: async () => {
    const [drivers, teams] = await Promise.all([getDriverStandings(), getConstructorStandings()]);
    return { drivers, teams };
  },
  errorComponent: DataError,
  component: ChampionshipPage,
});

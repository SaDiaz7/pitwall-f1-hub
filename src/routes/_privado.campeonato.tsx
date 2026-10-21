import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipPage } from "@/pages/ChampionshipPage";
import { DataError } from "@/components/DataError";
import {
  getConstructorStandings,
  getConstructorStandingsForSeason,
  getDriverStandings,
  getDriverStandingsForSeason,
} from "@/lib/f1";

export const Route = createFileRoute("/_privado/campeonato")({
  head: () => ({
    meta: [
      { title: "Campeonato — PitWall" },
      { name: "description", content: "Tablas de pilotos y constructores." },
      { property: "og:title", content: "Campeonato — PitWall" },
      { property: "og:description", content: "Tablas de pilotos y constructores." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { season?: number } => {
    const season = Number(search["season"]);
    return Number.isInteger(season) && season >= 1950 && season <= 2100 ? { season } : {};
  },
  loaderDeps: ({ search }) => ({ season: search.season ?? null }),
  loader: async ({ deps }) => {
    if (deps.season === null) {
      const [drivers, teams] = await Promise.all([getDriverStandings(), getConstructorStandings()]);
      return { drivers, teams };
    }

    const season = deps.season;
    const [drivers, teams] = await Promise.all([
      getDriverStandingsForSeason({ data: { season } }),
      getConstructorStandingsForSeason({ data: { season } }),
    ]);
    return { drivers, teams };
  },
  errorComponent: DataError,
  component: ChampionshipPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipPage } from "@/pages/ChampionshipPage";
import { DataError } from "@/components/DataError";
import {
  getConstructorStandings,
  getConstructorStandingsForSeason,
  getDriverStandings,
  getDriverStandingsForSeason,
  getSchedule,
} from "@/lib/f1";
import type { GrandPrix } from "@/lib/types";

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
    const currentYear = new Date().getFullYear();

    // Sin año, o con el año en curso, usamos la temporada actual y su calendario.
    if (deps.season === null || deps.season === currentYear) {
      const [drivers, teams, schedule] = await Promise.all([
        getDriverStandings(),
        getConstructorStandings(),
        getSchedule().catch((): GrandPrix[] => []),
      ]);
      return { drivers, teams, schedule };
    }

    const season = deps.season;
    const [drivers, teams] = await Promise.all([
      getDriverStandingsForSeason({ data: { season } }),
      getConstructorStandingsForSeason({ data: { season } }),
    ]);
    const schedule: GrandPrix[] = [];
    return { drivers, teams, schedule };
  },
  errorComponent: DataError,
  component: ChampionshipPage,
});

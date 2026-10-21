import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";
import { DataError } from "@/components/DataError";
import { getDriverStandings, getRaceResults, getSchedule, type RaceResult } from "@/lib/f1";
import type { Driver } from "@/lib/types";

export const Route = createFileRoute("/_privado/inicio")({
  head: () => ({
    meta: [
      { title: "Inicio — PitWall" },
      { name: "description", content: "Resumen de la temporada y próxima carrera." },
      { property: "og:title", content: "Inicio — PitWall" },
      { property: "og:description", content: "Resumen de la temporada y próxima carrera." },
    ],
  }),
  loader: async () => {
    const grandsPrix = await getSchedule();
    const last = [...grandsPrix].reverse().find((gp) => gp.status === "finalizado");

    // Si fallan los datos secundarios, el Inicio se muestra igual.
    const [lastResults, drivers] = await Promise.all([
      last
        ? getRaceResults({ data: { round: last.round } }).catch((): RaceResult[] => [])
        : Promise.resolve<RaceResult[]>([]),
      getDriverStandings().catch((): Driver[] => []),
    ]);

    return { grandsPrix, lastResults, drivers };
  },
  errorComponent: DataError,
  component: HomePage,
});

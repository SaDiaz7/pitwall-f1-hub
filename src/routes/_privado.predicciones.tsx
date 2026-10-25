import { createFileRoute } from "@tanstack/react-router";
import { DataError } from "@/components/DataError";
import { PredictionsPage } from "@/pages/PredictionsPages";
import { getDriverStandings, getSchedule } from "@/lib/f1";

export const Route = createFileRoute("/_privado/predicciones")({
  head: () => ({
    meta: [
      { title: "Predicciones — PitWall" },
      { name: "description", content: "Predecí el top 10 de cada carrera y sumá puntos." },
    ],
  }),
  loader: async () => {
    const [grandsPrix, drivers] = await Promise.all([getSchedule(), getDriverStandings()]);
    return { grandsPrix, drivers };
  },
  errorComponent: DataError,
  component: PredictionsPage,
});
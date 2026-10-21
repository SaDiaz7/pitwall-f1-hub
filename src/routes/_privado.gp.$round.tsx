import { createFileRoute, notFound } from "@tanstack/react-router";
import { DataError } from "@/components/DataError";
import { GrandPrixPage } from "@/pages/GrandPrixPage";
import {
  getRaceResults,
  getSchedule,
  getWeather,
  type RaceResult,
  type WeatherForecast,
} from "@/lib/f1";

export const Route = createFileRoute("/_privado/gp/$round")({
  head: () => ({
    meta: [{ title: "Gran Premio — PitWall" }],
  }),
  loader: async ({ params }) => {
    const round = Number(params.round);
    const schedule = await getSchedule();
    const gp = schedule.find((g) => g.round === round);
    if (!gp) throw notFound();

    // Si la carrera ya se corrió, traemos la clasificación. Si no, el pronóstico.
    if (gp.status === "finalizado") {
      const results = await getRaceResults({ data: { round } }).catch((): RaceResult[] => []);
      return { gp, results, weather: null as WeatherForecast | null };
    }

    const weather = await getWeather({ data: { lat: gp.lat, lng: gp.lng } }).catch(
      (): WeatherForecast | null => null,
    );
    return { gp, results: [] as RaceResult[], weather };
  },
  errorComponent: DataError,
  notFoundComponent: () => (
    <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
      No encontramos ese Gran Premio.
    </div>
  ),
  component: GrandPrixPage,
});

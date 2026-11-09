import { createFileRoute } from "@tanstack/react-router";
import { DataError } from "@/components/DataError";
import { MyDriverPage } from "@/pages/MyDriverPage";
import { getDriverStandings } from "@/lib/f1";
import type { Driver } from "@/lib/types";

export const Route = createFileRoute("/_privado/mi-piloto")({
  head: () => ({
    meta: [{ title: "Mi piloto — PitWall" }],
  }),
  validateSearch: (search: Record<string, unknown>): { piloto?: string | undefined } => ({
    piloto: typeof search["piloto"] === "string" ? search["piloto"] : undefined,
  }),
  loader: async () => {
    const drivers = await getDriverStandings().catch((): Driver[] => []);
    return { drivers };
  },
  errorComponent: DataError,
  component: MyDriverPage,
});
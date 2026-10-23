import { createFileRoute, notFound } from "@tanstack/react-router";
import { DataError } from "@/components/DataError";
import { DriverPage } from "@/pages/DriverPage";
import { getDriverDetail, getDriverStandings } from "@/lib/f1";
import type { Driver } from "@/lib/types";

export const Route = createFileRoute("/_privado/piloto/$id")({
  head: () => ({
    meta: [{ title: "Piloto — PitWall" }],
  }),
  loader: async ({ params }) => {
    const detail = await getDriverDetail({ data: { id: params.id } });
    if (!detail) throw notFound();

    // Si corre esta temporada, traemos su posición actual.
    const standings = await getDriverStandings().catch((): Driver[] => []);
    const index = standings.findIndex((d) => d.id === params.id);
    const entry = index === -1 ? undefined : standings[index];
    const current = entry ? { position: index + 1, driver: entry } : null;

    return { detail, current };
  },
  errorComponent: DataError,
  notFoundComponent: () => (
    <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
      No encontramos a ese piloto.
    </div>
  ),
  component: DriverPage,
});
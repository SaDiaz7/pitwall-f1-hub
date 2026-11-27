import { createFileRoute, notFound } from "@tanstack/react-router";
import { DataError } from "@/components/DataError";
import { DriverPage } from "@/pages/DriverPage";
import { getDriverDetail, getDriverStandings } from "@/lib/f1";
import type { Driver } from "@/lib/types";

export const Route = createFileRoute("/_privado/piloto/$id")({
  head: ({ loaderData, params }) => {
    const data = loaderData as { detail?: { profile?: { name?: string } } } | undefined;
    const name = data?.detail?.profile?.name;
    const title = name ? `${name} — PitWall` : "Piloto — PitWall";
    const description = name
      ? `Todo sobre ${name} en la F1: equipos, temporadas, victorias, podios y poles.`
      : "Ficha de piloto de Fórmula 1: equipos, temporadas, victorias, podios y poles.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `https://pitwallff1.netlify.app/piloto/${params.id}` },
        { property: "og:image", content: "https://pitwallff1.netlify.app/icon-512.png" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
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
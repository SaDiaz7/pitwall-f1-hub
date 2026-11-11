import { createFileRoute } from "@tanstack/react-router";
import { DataError } from "@/components/DataError";
import { ColapintoPage } from "@/pages/ColapintoPage";
import { getDriverDetail, getDriverStandings, getSchedule } from "@/lib/f1";
import { COLAPINTO_ID } from "@/lib/colapinto";
import type { Driver, GrandPrix } from "@/lib/types";

const TITLE = "Zona Colapinto — PitWall";
const DESCRIPTION =
  "Todo sobre Franco Colapinto en la F1: resultados, puntos, próxima carrera, noticias y fondos de pantalla.";
const URL = "https://pitwallff1.netlify.app/colapinto";
const IMAGE = "https://pitwallff1.netlify.app/icon-512.png";

export const Route = createFileRoute("/_privado/colapinto")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:image", content: IMAGE },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: IMAGE },
    ],
  }),
  loader: async () => {
    const [drivers, schedule] = await Promise.all([
      getDriverStandings().catch((): Driver[] => []),
      getSchedule().catch((): GrandPrix[] => []),
    ]);

    const index = drivers.findIndex((d) => d.id === COLAPINTO_ID || d.name.includes("Colapinto"));
    const driverId = drivers[index]?.id ?? COLAPINTO_ID;
    const detail = await getDriverDetail({ data: { id: driverId } }).catch(() => null);
    const next = schedule.find((gp) => gp.status === "proximo") ?? null;

    return { drivers, driverId, position: index === -1 ? null : index + 1, detail, next };
  },
  errorComponent: DataError,
  component: ColapintoPage,
});
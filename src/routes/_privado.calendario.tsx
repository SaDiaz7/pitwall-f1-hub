import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/pages/CalendarPage";
import { DataError } from "@/components/DataError";
import { getPodiums, getSchedule, type Podiums } from "@/lib/f1";

export const Route = createFileRoute("/_privado/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario — PitWall" },
      { name: "description", content: "Todos los Grandes Premios de la temporada." },
      { property: "og:title", content: "Calendario — PitWall" },
      { property: "og:description", content: "Todos los Grandes Premios de la temporada." },
    ],
  }),
  loader: async () => {
    // Si fallan los podios, el calendario se muestra igual.
    const [grandsPrix, podiums] = await Promise.all([
      getSchedule(),
      getPodiums().catch((): Podiums => ({})),
    ]);
    return { grandsPrix, podiums };
  },
  errorComponent: DataError,
  component: CalendarPage,
});

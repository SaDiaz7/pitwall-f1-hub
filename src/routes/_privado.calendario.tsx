import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/pages/CalendarPage";
import { DataError } from "@/components/DataError";
import { getSchedule } from "@/lib/f1";

export const Route = createFileRoute("/_privado/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario — PitWall" },
      { name: "description", content: "Todos los Grandes Premios de la temporada." },
      { property: "og:title", content: "Calendario — PitWall" },
      { property: "og:description", content: "Todos los Grandes Premios de la temporada." },
    ],
  }),
  loader: () => getSchedule(),
  errorComponent: DataError,
  component: CalendarPage,
});

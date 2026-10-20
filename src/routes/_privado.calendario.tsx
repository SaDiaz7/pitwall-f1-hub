import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/pages/CalendarPage";

export const Route = createFileRoute("/_privado/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario — PitWall" },
      { name: "description", content: "Todos los Grandes Premios de la temporada." },
      { property: "og:title", content: "Calendario — PitWall" },
      { property: "og:description", content: "Todos los Grandes Premios de la temporada." },
    ],
  }),
  component: CalendarPage,
});

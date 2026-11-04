import { createFileRoute } from "@tanstack/react-router";
import { LeaguesPage } from "@/pages/LeaguesPage";

export const Route = createFileRoute("/_privado/ligas")({
  head: () => ({
    meta: [
      { title: "Ligas — PitWall" },
      { name: "description", content: "Competí con tus amigos en ligas privadas." },
    ],
  }),
  component: LeaguesPage,
});
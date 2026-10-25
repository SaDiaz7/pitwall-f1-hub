import { createFileRoute } from "@tanstack/react-router";
import { FriendsPage } from "@/pages/FriendsPage";

export const Route = createFileRoute("/_privado/amigos")({
  head: () => ({
    meta: [
      { title: "Amigos — PitWall" },
      { name: "description", content: "Buscá a otros fans y agregalos como amigos." },
    ],
  }),
  component: FriendsPage,
});
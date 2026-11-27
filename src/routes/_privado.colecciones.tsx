import { createFileRoute } from "@tanstack/react-router";
import { CollectionsPage } from "@/pages/CollectionsPage";

export const Route = createFileRoute("/_privado/colecciones")({
  head: () => ({
    meta: [{ title: "Colecciones — PitWall" }],
  }),
  component: CollectionsPage,
});
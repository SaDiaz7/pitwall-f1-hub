import { createFileRoute } from "@tanstack/react-router";
import { DuplicatesPage } from "@/pages/DuplicatesPage";

export const Route = createFileRoute("/_privado/repetidas")({
  head: () => ({
    meta: [{ title: "Repetidas — PitWall" }],
  }),
  component: DuplicatesPage,
});
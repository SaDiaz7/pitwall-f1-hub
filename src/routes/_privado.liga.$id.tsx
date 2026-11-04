import { createFileRoute } from "@tanstack/react-router";
import { LeaguePage } from "@/pages/LeaguePage";

export const Route = createFileRoute("/_privado/liga/$id")({
  head: () => ({
    meta: [{ title: "Liga — PitWall" }],
  }),
  component: LeaguePage,
});
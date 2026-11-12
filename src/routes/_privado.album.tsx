import { createFileRoute } from "@tanstack/react-router";
import { AlbumPage } from "@/pages/AlbumPage";

export const Route = createFileRoute("/_privado/album")({
  head: () => ({
    meta: [{ title: "Álbum de cartas — PitWall" }],
  }),
  component: AlbumPage,
});
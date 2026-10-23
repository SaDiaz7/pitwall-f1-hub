import { createFileRoute } from "@tanstack/react-router";
import { BingoPage } from "@/pages/BingoPage";

export const Route = createFileRoute("/_privado/bingo")({
  head: () => ({
    meta: [
      { title: "Bingo — PitWall" },
      { name: "description", content: "Tu bingo de la temporada de Fórmula 1." },
      { property: "og:title", content: "Bingo — PitWall" },
      { property: "og:description", content: "Tu bingo de la temporada de Fórmula 1." },
    ],
  }),
  component: BingoPage,
});
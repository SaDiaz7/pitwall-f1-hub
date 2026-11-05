import { createFileRoute } from "@tanstack/react-router";
import { GamePage } from "@/pages/GamePage";

export const Route = createFileRoute("/_privado/juego")({
  head: () => ({
    meta: [
      { title: "Adiviná el circuito — PitWall" },
      { name: "description", content: "Un circuito de Fórmula 1 nuevo cada día. ¿Lo reconocés por su trazado?" },
      { property: "og:title", content: "Adiviná el circuito — PitWall" },
      {
        property: "og:description",
        content: "Un circuito de Fórmula 1 nuevo cada día. ¿Lo reconocés por su trazado?",
      },
    ],
  }),
  component: GamePage,
});

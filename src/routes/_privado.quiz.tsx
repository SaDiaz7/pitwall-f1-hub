import { createFileRoute } from "@tanstack/react-router";
import { QuizPage } from "@/pages/QuizPage";

export const Route = createFileRoute("/_privado/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz de F1: ¿cuánto sabés? — PitWall" },
      {
        name: "description",
        content: "Ocho preguntas para saber qué nivel de Fórmula 1 tenés: de Rookie a Campeón del mundo.",
      },
      { property: "og:title", content: "Quiz de F1: ¿cuánto sabés? — PitWall" },
      {
        property: "og:description",
        content: "Ocho preguntas para saber qué nivel de Fórmula 1 tenés: de Rookie a Campeón del mundo.",
      },
    ],
  }),
  component: QuizPage,
});
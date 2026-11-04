import { createFileRoute } from "@tanstack/react-router";
import { InvitePage } from "@/pages/InvitePage";

export const Route = createFileRoute("/invitacion/$code")({
  head: () => ({
    meta: [
      { title: "Te invitaron a una liga — PitWall" },
      { name: "description", content: "Sumate a una liga privada de predicciones de Fórmula 1." },
      { property: "og:title", content: "Te invitaron a una liga en PitWall" },
      { property: "og:description", content: "Sumate a una liga privada de predicciones de Fórmula 1." },
    ],
  }),
  component: InvitePage,
});
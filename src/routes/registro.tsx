import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — PitWall" },
      { name: "description", content: "Creá tu cuenta gratis en PitWall." },
      { property: "og:title", content: "Crear cuenta — PitWall" },
      { property: "og:description", content: "Creá tu cuenta gratis en PitWall." },
    ],
  }),
  component: () => <AuthForm mode="registro" />,
});

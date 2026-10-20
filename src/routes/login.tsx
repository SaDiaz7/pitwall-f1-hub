import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — PitWall" },
      { name: "description", content: "Entrá a tu cuenta de PitWall." },
      { property: "og:title", content: "Iniciar sesión — PitWall" },
      { property: "og:description", content: "Entrá a tu cuenta de PitWall." },
    ],
  }),
  component: () => <AuthForm mode="login" />,
});

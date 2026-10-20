import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPage";

export const Route = createFileRoute("/_privado/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes — PitWall" },
      { name: "description", content: "Perfil, privacidad y notificaciones." },
      { property: "og:title", content: "Ajustes — PitWall" },
      { property: "og:description", content: "Perfil, privacidad y notificaciones." },
    ],
  }),
  component: SettingsPage,
});

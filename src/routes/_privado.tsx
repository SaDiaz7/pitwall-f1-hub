import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

// Marco de toda la app. Qué páginas piden sesión se define en AppShell (isPublicPath).
export const Route = createFileRoute("/_privado")({
  ssr: false, // la sesión vive en el navegador, así que esto se dibuja ahí
  component: AppShell,
});
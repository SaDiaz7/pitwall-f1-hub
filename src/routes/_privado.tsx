import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

// Layout de la zona privada. Acá se agregará la verificación de sesión.
export const Route = createFileRoute("/_privado")({
  component: AppShell,
});

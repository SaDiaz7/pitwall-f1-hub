import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";

export const Route = createFileRoute("/restablecer")({
  head: () => ({
    meta: [{ title: "Nueva contraseña — PitWall" }],
  }),
  component: ResetPasswordPage,
});
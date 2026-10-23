import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";

export const Route = createFileRoute("/olvide")({
  head: () => ({
    meta: [{ title: "Recuperar cuenta — PitWall" }],
  }),
  component: ForgotPasswordPage,
});
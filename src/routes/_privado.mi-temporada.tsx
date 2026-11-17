import { createFileRoute } from "@tanstack/react-router";
import { WrappedPage } from "@/pages/WrappedPage";

export const Route = createFileRoute("/_privado/mi-temporada")({
  component: WrappedPage,
});
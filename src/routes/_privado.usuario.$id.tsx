import { createFileRoute } from "@tanstack/react-router";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { getDriverStandings } from "@/lib/f1";
import type { Driver } from "@/lib/types";

export const Route = createFileRoute("/_privado/usuario/$id")({
  head: () => ({
    meta: [{ title: "Perfil — PitWall" }],
  }),
  // Los pilotos sirven para mostrar nombres en las predicciones.
  loader: async () => ({
    drivers: await getDriverStandings().catch((): Driver[] => []),
  }),
  component: UserProfilePage,
});
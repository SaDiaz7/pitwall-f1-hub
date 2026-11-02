import { createFileRoute } from "@tanstack/react-router";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { getConstructorStandings, getDriverStandings } from "@/lib/f1";
import type { Driver, Team } from "@/lib/types";

export const Route = createFileRoute("/_privado/usuario/$id")({
  head: () => ({
    meta: [{ title: "Perfil — PitWall" }],
  }),
  // Pilotos y equipos sirven para mostrar nombres en las predicciones y los favoritos.
  loader: async () => {
    const [drivers, teams] = await Promise.all([
      getDriverStandings().catch((): Driver[] => []),
      getConstructorStandings().catch((): Team[] => []),
    ]);
    return { drivers, teams };
  },
  component: UserProfilePage,
});
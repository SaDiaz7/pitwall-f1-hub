import { getRouteApi } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { StandingsTable } from "@/components/StandingsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const route = getRouteApi("/_privado/campeonato");

export function ChampionshipPage() {
  const { drivers, teams } = route.useLoaderData();

  const driverRows = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    team: d.teamName,
    points: d.points,
    wins: d.wins,
  }));

  return (
    <>
      <PageHeader title="Campeonato" subtitle="Posiciones actualizadas de la temporada." />
      <Tabs defaultValue="pilotos">
        <TabsList className="mb-4">
          <TabsTrigger value="pilotos">Pilotos</TabsTrigger>
          <TabsTrigger value="constructores">Constructores</TabsTrigger>
        </TabsList>
        <TabsContent value="pilotos"><StandingsTable rows={driverRows} /></TabsContent>
        <TabsContent value="constructores"><StandingsTable rows={teams} showTeam={false} /></TabsContent>
      </Tabs>
    </>
  );
}

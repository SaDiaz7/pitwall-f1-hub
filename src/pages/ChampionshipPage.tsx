import { PageHeader } from "@/components/PageHeader";
import { StandingsTable } from "@/components/StandingsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { drivers, getTeam, teams } from "@/data/mockData";

export function ChampionshipPage() {
  const driverRows = [...drivers]
    .sort((a, b) => b.points - a.points)
    .map((d) => ({ id: d.id, name: d.name, team: getTeam(d.teamId)?.name, points: d.points, wins: d.wins }));
  const teamRows = [...teams].sort((a, b) => b.points - a.points);

  return (
    <>
      <PageHeader title="Campeonato" subtitle="Posiciones actualizadas de la temporada." />
      <Tabs defaultValue="pilotos">
        <TabsList className="mb-4">
          <TabsTrigger value="pilotos">Pilotos</TabsTrigger>
          <TabsTrigger value="constructores">Constructores</TabsTrigger>
        </TabsList>
        <TabsContent value="pilotos"><StandingsTable rows={driverRows} /></TabsContent>
        <TabsContent value="constructores"><StandingsTable rows={teamRows} showTeam={false} /></TabsContent>
      </Tabs>
    </>
  );
}

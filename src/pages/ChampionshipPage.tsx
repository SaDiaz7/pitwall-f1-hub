import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { StandingsTable } from "@/components/StandingsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFavorites } from "@/hooks/useFavorites";

const route = getRouteApi("/_privado/campeonato");

const CURRENT_YEAR = new Date().getFullYear();
const PAST_YEARS = Array.from({ length: CURRENT_YEAR - 1950 }, (_, i) => CURRENT_YEAR - 1 - i);

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">{text}</div>;
}

export function ChampionshipPage() {
  const { drivers, teams } = route.useLoaderData();
  const { season } = route.useSearch();
  const navigate = useNavigate();
  const { isFavorite, toggle, error } = useFavorites();

  // Las estrellas solo tienen sentido en la temporada en curso.
  const isCurrent = season === undefined || season === CURRENT_YEAR;

  const onSeasonChange = (value: string) => {
    navigate({ to: "/campeonato", search: value === "" ? {} : { season: Number(value) } });
  };

  const driverRows = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    team: d.teamName,
    points: d.points,
    wins: d.wins,
  }));

  return (
    <>
      <PageHeader
        title="Campeonato"
        subtitle={season === undefined ? "Posiciones actualizadas de la temporada." : `Posiciones finales de ${season}.`}
      />

      <label className="mb-4 block max-w-xs space-y-1.5 text-sm font-medium">
        <span>Temporada</span>
        <select
          value={season === undefined ? "" : String(season)}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="h-10 w-full rounded-md border bg-card px-3 text-sm"
        >
          <option value="">Actual ({CURRENT_YEAR})</option>
          {PAST_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      {isCurrent && error && (
        <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>
      )}

      <Tabs defaultValue="pilotos">
        <TabsList className="mb-4">
          <TabsTrigger value="pilotos">Pilotos</TabsTrigger>
          <TabsTrigger value="constructores">Constructores</TabsTrigger>
        </TabsList>
        <TabsContent value="pilotos">
          {drivers.length === 0 ? (
            <Empty text="No hay datos de pilotos para esa temporada." />
          ) : (
            <StandingsTable
              rows={driverRows}
              {...(isCurrent ? { isFavorite, onToggleFavorite: toggle } : {})}
            />
          )}
        </TabsContent>
        <TabsContent value="constructores">
          {teams.length === 0 ? (
            <Empty text="No hay tabla de constructores para esa temporada (ese campeonato empezó en 1958)." />
          ) : (
            <StandingsTable rows={teams} showTeam={false} />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Trophy } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import type { CareerSeason } from "@/lib/f1";

const route = getRouteApi("/_privado/piloto/$id");

const NATIONALITIES: Record<string, string> = {
  American: "Estadounidense",
  Argentine: "Argentino",
  Australian: "Australiano",
  Austrian: "Austríaco",
  Belgian: "Belga",
  Brazilian: "Brasileño",
  British: "Británico",
  Canadian: "Canadiense",
  Chilean: "Chileno",
  Chinese: "Chino",
  Colombian: "Colombiano",
  Danish: "Danés",
  Dutch: "Neerlandés",
  Finnish: "Finlandés",
  French: "Francés",
  German: "Alemán",
  Hungarian: "Húngaro",
  Indian: "Indio",
  Indonesian: "Indonesio",
  Irish: "Irlandés",
  Italian: "Italiano",
  Japanese: "Japonés",
  Malaysian: "Malasio",
  Mexican: "Mexicano",
  Monegasque: "Monegasco",
  "New Zealander": "Neozelandés",
  Polish: "Polaco",
  Portuguese: "Portugués",
  Russian: "Ruso",
  "South African": "Sudafricano",
  Spanish: "Español",
  Swedish: "Sueco",
  Swiss: "Suizo",
  Thai: "Tailandés",
  Uruguayan: "Uruguayo",
  Venezuelan: "Venezolano",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function ageFrom(dateOfBirth: string): number {
  const born = new Date(`${dateOfBirth}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - born.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
}

interface Stint {
  team: string;
  from: number;
  to: number;
}

// Agrupa las temporadas consecutivas en un mismo equipo.
function buildStints(seasons: CareerSeason[]): Stint[] {
  const stints: Stint[] = [];
  for (const season of seasons) {
    for (const team of season.teams) {
      const last = stints[stints.length - 1];
      if (last && last.team === team && season.season - last.to <= 1) {
        last.to = season.season;
      } else {
        stints.push({ team, from: season.season, to: season.season });
      }
    }
  }
  return stints;
}

const years = (stint: Stint) => (stint.from === stint.to ? `${stint.from}` : `${stint.from}–${stint.to}`);

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="font-display text-3xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

const show = (n: number | null) => (n === null ? "—" : String(n));

export function DriverPage() {
  const { detail, current } = route.useLoaderData();
  const { profile, seasons, totals } = detail;
  const { isFavorite, toggle } = useFavorites();

  const stints = buildStints(seasons);
  const lastSeason = seasons[seasons.length - 1];
  const currentYear = new Date().getFullYear();
  const racesNow = current !== null;

  // Equipo actual (solo si corre hoy) y equipos anteriores.
  const currentStint = racesNow ? stints[stints.length - 1] : undefined;
  const previousStints = currentStint ? stints.slice(0, -1) : stints;
  const lastTeam = current?.driver.teamName ?? lastSeason?.teams[lastSeason.teams.length - 1];

  const nationality = NATIONALITIES[profile.nationality] ?? profile.nationality;
  const born = new Date(`${profile.dateOfBirth}T00:00:00Z`);

  return (
    <>
      <Link
        to="/campeonato"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al campeonato
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.number !== null && (
            <span className="font-display text-6xl font-bold leading-none text-primary">{profile.number}</span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold uppercase leading-tight md:text-4xl">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[lastTeam, nationality].filter(Boolean).join(" · ")}
            </p>
            <p className="text-sm text-muted-foreground">
              Nació el {dateFormatter.format(born)}
              {racesNow ? ` (${ageFrom(profile.dateOfBirth)} años)` : ""}
            </p>
          </div>
        </div>
        <FavoriteButton
          active={isFavorite(profile.id)}
          onToggle={() => toggle(profile.id)}
          label={profile.name}
        />
      </header>

      {current && (
        <section className="mb-6 space-y-3">
          <h2 className="text-xl font-bold uppercase">Temporada {currentYear}</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Posición" value={`P${current.position}`} />
            <StatCard label="Puntos" value={String(current.driver.points)} />
            <StatCard label="Victorias" value={String(current.driver.wins)} />
          </div>
        </section>
      )}

      <section className="mb-6 space-y-3">
        <h2 className="text-xl font-bold uppercase">Carrera en la F1</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Grandes Premios" value={show(totals.starts)} />
          <StatCard label="Victorias" value={show(totals.wins)} />
          <StatCard label="Podios" value={show(totals.podiums)} />
          <StatCard label="Poles" value={show(totals.poles)} />
          <StatCard label="Títulos" value={show(totals.titles)} />
          <StatCard label="Temporadas" value={seasons.length === 0 ? "—" : String(seasons.length)} />
        </div>
        <p className="text-xs text-muted-foreground">
          Poles: largadas desde el primer puesto de la grilla. Los guiones indican datos que la API no devolvió.
        </p>
      </section>

      <section className="mb-6 space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="text-xl font-bold uppercase">Equipos</h2>
        {currentStint && (
          <p className="text-sm">
            Corre con <span className="font-semibold">{currentStint.team}</span> desde{" "}
            <span className="font-semibold">{currentStint.from}</span>.
          </p>
        )}
        {previousStints.length > 0 ? (
          <div>
            <p className="mb-1.5 text-sm text-muted-foreground">
              {currentStint ? "Equipos anteriores:" : "Equipos en su carrera:"}
            </p>
            <ul className="space-y-1 text-sm">
              {previousStints.map((stint) => (
                <li key={`${stint.team}-${stint.from}`} className="flex justify-between gap-3">
                  <span className="font-semibold">{stint.team}</span>
                  <span className="tabular-nums text-muted-foreground">{years(stint)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          !currentStint && <p className="text-sm text-muted-foreground">No hay datos de equipos.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Los años son por temporada, y los equipos aparecen con el nombre que tenían en cada año.
        </p>
      </section>

      <section className="mb-6 space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="text-xl font-bold uppercase">Historial por temporada</h2>
        {seasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay datos de temporadas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left">Año</th>
                  <th className="px-2 py-2 text-left">Equipo</th>
                  <th className="px-2 py-2 text-right">Pos</th>
                  <th className="px-2 py-2 text-right">Pts</th>
                  <th className="px-2 py-2 text-right">Vict.</th>
                </tr>
              </thead>
              <tbody>
                {[...seasons].reverse().map((s) => {
                  const champion = s.position === 1 && s.season < currentYear;
                  return (
                    <tr key={s.season} className="border-t">
                      <td className="px-2 py-2 font-semibold tabular-nums">{s.season}</td>
                      <td className="px-2 py-2 text-muted-foreground">{s.teams.join(" / ") || "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          {champion && <Trophy className="h-4 w-4 text-primary" aria-label="Campeón" />}
                          {s.position === null ? "—" : `P${s.position}`}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{s.points}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{s.wins}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {profile.wikiUrl && (
        <a
          href={profile.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Más información en Wikipedia <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </>
  );
}
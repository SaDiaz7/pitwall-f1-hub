import { Link } from "@tanstack/react-router";
import { DriverAvatar } from "@/components/DriverAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { TeamStripe } from "@/components/TeamStripe";
import type { DriverPhoto } from "@/lib/f1";
import { cn } from "@/lib/utils";

export interface StandingRow {
  id: string;
  name: string;
  team?: string | undefined;
  teamId?: string | undefined;
  points: number;
  wins: number;
}

interface StandingsTableProps {
  rows: StandingRow[];
  showTeam?: boolean;
  // Si es true, el nombre enlaza a la ficha del piloto.
  driverLinks?: boolean;
  // Si se pasa, cada fila muestra la foto del piloto (o sus iniciales).
  photos?: Record<string, DriverPhoto | null> | undefined;
  // Si se pasan las dos, la tabla muestra la columna de la estrella.
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
}

export function StandingsTable({
  rows,
  showTeam = true,
  driverLinks = false,
  photos,
  isFavorite,
  onToggleFavorite,
}: StandingsTableProps) {
  const showFavorites = Boolean(isFavorite && onToggleFavorite);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-3 text-left">Pos</th>
            <th className="px-3 py-3 text-left">Nombre</th>
            {showTeam && <th className="hidden px-3 py-3 text-left sm:table-cell">Equipo</th>}
            <th className="px-3 py-3 text-right">Vict.</th>
            <th className="px-3 py-3 text-right">Pts</th>
            {showFavorites && <th className="w-12 px-2 py-3" aria-label="Favorito" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t transition-colors hover:bg-accent/50">
              <td className="px-3 py-3">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md font-display text-base font-bold",
                    i === 0 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
                  )}
                >
                  {i + 1}
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <TeamStripe teamId={r.teamId ?? r.id} teamName={r.team ?? r.name} className="h-9" />
                  {photos && <DriverAvatar name={r.name} photo={photos[r.id] ?? null} size="sm" />}
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {driverLinks ? (
                        <Link to="/piloto/$id" params={{ id: r.id }} className="hover:text-primary hover:underline">
                          {r.name}
                        </Link>
                      ) : (
                        r.name
                      )}
                    </div>
                    {showTeam && <div className="text-xs text-muted-foreground sm:hidden">{r.team}</div>}
                  </div>
                </div>
              </td>
              {showTeam && <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">{r.team}</td>}
              <td className="px-3 py-3 text-right tabular-nums">{r.wins}</td>
              <td className="px-3 py-3 text-right font-display text-lg font-bold tabular-nums">{r.points}</td>
              {isFavorite && onToggleFavorite && (
                <td className="px-2 py-3 text-right">
                  <FavoriteButton
                    active={isFavorite(r.id)}
                    onToggle={() => onToggleFavorite(r.id)}
                    label={r.name}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

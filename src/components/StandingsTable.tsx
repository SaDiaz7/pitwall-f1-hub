import { cn } from "@/lib/utils";

export interface StandingRow {
  id: string;
  name: string;
  team?: string | undefined;
  points: number;
  wins: number;
}

export function StandingsTable({ rows, showTeam = true }: { rows: StandingRow[]; showTeam?: boolean }) {
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
                <div className="font-semibold">{r.name}</div>
                {showTeam && <div className="text-xs text-muted-foreground sm:hidden">{r.team}</div>}
              </td>
              {showTeam && <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">{r.team}</td>}
              <td className="px-3 py-3 text-right tabular-nums">{r.wins}</td>
              <td className="px-3 py-3 text-right font-display text-lg font-bold tabular-nums">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

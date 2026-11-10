import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatedBar } from "@/components/AnimatedBar";
import { DriverAvatar } from "@/components/DriverAvatar";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { getTeamColor } from "@/lib/team-colors";
import type { Driver } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

const ROW_CLASS = "fade-up card-link flex items-center gap-3 rounded-2xl border border-l-4 bg-card p-3";

export function TopFiveCard({ drivers, linked }: { drivers: Driver[]; linked: boolean }) {
  const top = drivers.slice(0, 5);
  const photos = useDriverPhotos(top.map((driver) => ({ id: driver.id, wikiUrl: driver.wikiUrl ?? null })));

  if (top.length === 0) return null;
  const leaderPoints = top[0]?.points ?? 0;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Top 5 del campeonato</h2>
        <div className="flex items-center gap-3">
          <Link
              to="/analisis"
              className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide transition hover:border-primary/50 hover:text-primary active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <Activity className="h-3.5 w-3.5" /> Sección "Análisis"
            </Link>
          <Link to="/campeonato" className="text-sm font-semibold text-primary hover:underline">
            Ver completo
          </Link>
        </div>
      </div>

      <ol className="space-y-2">
        {top.map((driver, index) => {
          const color = getTeamColor(driver.teamId, driver.teamName);
          const percent = leaderPoints > 0 ? Math.round((driver.points / leaderPoints) * 100) : 0;
          const style = { "--i": index, borderLeftColor: color } as CSSProperties;

          const content = (
            <>
              <span
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-display text-base font-bold",
                  index === 0 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
                )}
              >
                {index + 1}
              </span>
              <DriverAvatar name={driver.name} photo={photos[driver.id] ?? null} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold">{driver.name}</span>
                  <span className="shrink-0 font-display text-lg font-bold tabular-nums">
                    {driver.points} <span className="text-xs font-normal text-muted-foreground">pts</span>
                  </span>
                </div>
                <div className="mb-1.5 truncate text-xs text-muted-foreground">{driver.teamName}</div>
                <AnimatedBar percent={percent} color={color} />
              </div>
            </>
          );

          return (
            <li key={driver.id}>
              {linked ? (
                <Link to="/piloto/$id" params={{ id: driver.id }} className={ROW_CLASS} style={style}>
                  {content}
                </Link>
              ) : (
                <div className={ROW_CLASS} style={style}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">Fotos: Wikipedia/Wikimedia Commons.</p>
    </section>
  );
}
import type { CSSProperties } from "react";
import { ArrowUpDown, MapPin, Search, type LucideIcon } from "lucide-react";
import { GAME_LABELS, WEEKDAY_SHORT, WEEK_ORDER, type TodayInfo } from "@/lib/games";
import { cn } from "@/lib/utils";

const GAME_ICONS: Record<string, LucideIcon> = {
  circuit: MapPin,
  hl: ArrowUpDown,
  dg: Search,
};

// Tira con los 7 días de la semana y el juego que toca cada uno.
export function WeekStrip({ info }: { info: TodayInfo }) {
  const byDay = new Map(info.week.map((item) => [item.weekday, item.game]));
  const games = Array.from(new Set(info.week.map((item) => item.game)));

  return (
    <section className="fade-up rounded-2xl border bg-card p-4" aria-label="Juegos de la semana">
      <ol className="grid grid-cols-7 gap-2">
        {WEEK_ORDER.map((weekday, index) => {
          const game = byDay.get(weekday);
          const Icon = game ? GAME_ICONS[game] : undefined;
          const isToday = weekday === info.weekday;

          return (
            <li
              key={weekday}
              className={cn(
                "fade-up flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition-colors",
                isToday ? "border-primary bg-primary/15" : "bg-background/40",
              )}
              style={{ "--i": index } as CSSProperties}
              title={game ? (GAME_LABELS[game] ?? game) : "Sin juego"}
              aria-current={isToday ? "date" : undefined}
            >
              <span
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wide",
                  isToday ? "text-primary" : "text-muted-foreground",
                )}
              >
                {WEEKDAY_SHORT[weekday] ?? ""}
              </span>
              {Icon && (
                <Icon
                  className={cn("h-5 w-5", isToday ? "text-primary" : "text-muted-foreground")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {games.map((game) => {
          const Icon = GAME_ICONS[game];
          return (
            <span key={game} className="inline-flex items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              {GAME_LABELS[game] ?? game}
            </span>
          );
        })}
      </p>
    </section>
  );
}
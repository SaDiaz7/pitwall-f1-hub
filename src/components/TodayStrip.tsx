import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpDown, Check, Gift, MapPin, Search, Target, type LucideIcon } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { useFreePack } from "@/hooks/useFreePack";
import { useTodayProgress } from "@/hooks/useTodayProgress";
import { GAME_LABELS } from "@/lib/games";
import type { GrandPrix } from "@/lib/types";
import { cn } from "@/lib/utils";

const GAME_ICONS: Record<string, LucideIcon> = {
  circuit: MapPin,
  hl: ArrowUpDown,
  dg: Search,
};

const TILE =
  "card-link flex h-full items-center gap-3 rounded-2xl border bg-card p-3 text-left hover:bg-accent/40 active:scale-[0.98] motion-reduce:active:scale-100";

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

function TileContent({
  icon: Icon,
  label,
  status,
  done,
}: {
  icon: LucideIcon;
  label: string;
  status: string;
  done: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          done ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/15 text-primary",
        )}
      >
        {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="block truncate text-sm font-semibold">{status}</span>
      </span>
    </>
  );
}

// Lo que tenés para hacer hoy: el juego del día, el sobre gratis y la predicción de la próxima carrera.
export function TodayStrip({
  next,
  predictionDone,
  predictionLoading,
}: {
  next: GrandPrix | undefined;
  predictionDone: boolean;
  predictionLoading: boolean;
}) {
  const { progress, loading: progressLoading } = useTodayProgress();
  const { status: packStatus } = useFreePack();

  const game = progress?.game ?? null;
  const gameDone = progress?.finished ?? false;
  const packDone = packStatus === "claimed";
  const predDone = Boolean(next) && predictionDone;

  const total = (game ? 1 : 0) + 1 + (next ? 1 : 0);
  const doneCount = (game && gameDone ? 1 : 0) + (packDone ? 1 : 0) + (next && predDone ? 1 : 0);

  let gameStatus = "Todavía no jugaste hoy";
  if (progress) {
    const unit = progress.game === "hl" ? "duelos" : "intentos";
    if (progress.finished) gameStatus = "Terminado · ver resultado y sobre";
    else if (progress.started && progress.attempts > 0) {
      gameStatus = `Llevás ${progress.attempts} de ${progress.total} ${unit}`;
    }
  }

  const scrollToPack = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("sobre-gratis")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <section className="fade-up mt-10 space-y-3">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Tu día</h2>
        <p className="text-sm font-semibold tabular-nums text-muted-foreground">
          {doneCount}/{total} hechas
        </p>
      </div>
      <AnimatedBar percent={total > 0 ? Math.round((doneCount / total) * 100) : 0} className="h-1.5 max-w-sm" />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(14rem,18rem))]">
        {/* Juego del día */}
        {progressLoading ? (
          <li>
            <div className="skeleton h-[4.25rem]" />
          </li>
        ) : (
          game && (
            <li className="fade-up" style={stagger(0)}>
              <Link to="/juego" className={cn(TILE, !gameDone && "border-primary/60")}>
                <TileContent
                  icon={GAME_ICONS[game] ?? MapPin}
                  label={GAME_LABELS[game] ?? "Juego del día"}
                  status={gameStatus}
                  done={gameDone}
                />
              </Link>
            </li>
          )
        )}

        {/* Sobre gratis */}
        <li className="fade-up" style={stagger(1)}>
          {packStatus === null ? (
            <div className="skeleton h-[4.25rem]" />
          ) : packDone ? (
            <Link to="/album" className={TILE}>
              <TileContent icon={Gift} label="Sobre gratis" status="Reclamado · ver mi álbum" done />
            </Link>
          ) : (
            <button type="button" onClick={scrollToPack} className={cn(TILE, "w-full border-primary/60")}>
              <TileContent icon={Gift} label="Sobre gratis" status="Tu sobre te espera" done={false} />
            </button>
          )}
        </li>

        {/* Predicción de la próxima carrera */}
        {next &&
          (predictionLoading ? (
            <li>
              <div className="skeleton h-[4.25rem]" />
            </li>
          ) : (
            <li className="fade-up" style={stagger(2)}>
              <Link to="/predicciones" className={cn(TILE, !predDone && "border-primary/60")}>
                <TileContent
                  icon={Target}
                  label="Predicción"
                  status={predDone ? `Hecha · ${next.name}` : `Hacela · ${next.name}`}
                  done={predDone}
                />
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
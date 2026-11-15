import { Link } from "@tanstack/react-router";
import { ArrowUpDown, Flame } from "lucide-react";
import { DailyGameCard } from "@/components/DailyGameCard";
import { useHigherLower } from "@/hooks/useHigherLower";
import { useSession } from "@/hooks/useSession";
import { useTodayGame } from "@/hooks/useTodayGame";
import { GAME_LABELS } from "@/lib/games";
import { cn } from "@/lib/utils";

const SHELL = "relative h-full overflow-hidden rounded-2xl border bg-hero p-6 md:p-8";
const BUTTON =
  "mt-4 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105";

function Stripe() {
  return <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />;
}

function Message({ children }: { children: string }) {
  return (
    <section className={SHELL}>
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Juego diario</p>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
      <Stripe />
    </section>
  );
}

function GuestCard({ game }: { game: string }) {
  return (
    <section className={SHELL}>
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Juego diario</p>
      <h2 className="mt-2 text-4xl font-bold uppercase italic md:text-5xl">{GAME_LABELS[game] ?? "Juego de hoy"}</h2>
      <p className="mt-3 text-muted-foreground">
        Un juego distinto cada día y un sobre de cartas para quien lo completa. Creá una cuenta gratis para jugar.
      </p>
      <Link to="/registro" className={BUTTON}>
        Crear mi cuenta gratis
      </Link>
      <Stripe />
    </section>
  );
}

function HigherLowerCard() {
  const { game, loading, error } = useHigherLower();

  if (loading) return <Message>Cargando el juego de hoy…</Message>;
  if (error || !game) return <Message>El juego de hoy no está disponible por el momento.</Message>;

  const answered = game.rounds.length;

  let status = "Todavía no jugaste hoy.";
  if (game.finished) status = `Terminaste con ${game.score}/${game.total} aciertos.`;
  else if (answered > 0) status = `Llevás ${answered} de ${game.total} duelos.`;

  const buttonLabel = game.finished
    ? "Ver resultado y sobre →"
    : answered > 0
      ? "Seguir jugando →"
      : "Jugar ahora →";

  return (
    <section className={SHELL}>
      <div className="grid items-center gap-6 md:grid-cols-[1fr_16rem]">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Juego diario</p>
          <Link to="/juego" className="hover:text-primary">
            <h2 className="mt-2 text-4xl font-bold uppercase italic md:text-5xl">¿Más o menos?</h2>
          </Link>
          <p className="mt-3 text-muted-foreground">
            10 duelos con estadísticas reales de pilotos. ¿Tiene más o menos que el otro?
          </p>
          <p className="mt-2 font-display text-xl font-semibold">{status}</p>
          {game.streak > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <Flame className="h-4 w-4 text-orange-400" /> Racha: {game.streak} {game.streak === 1 ? "día" : "días"}
            </p>
          )}
          <Link to="/juego" className={BUTTON}>
            {buttonLabel}
          </Link>
        </div>

        <div className="flex h-36 flex-col items-center justify-center gap-4 text-primary md:h-44">
          <ArrowUpDown className="h-16 w-16" aria-hidden="true" />
          <ol className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: game.total }, (_, index) => {
              const played = game.rounds[index];
              return (
                <li
                  key={index}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    played ? (played.correct ? "bg-emerald-400" : "bg-red-400") : "bg-secondary",
                  )}
                />
              );
            })}
          </ol>
        </div>
      </div>
      <Stripe />
    </section>
  );
}

export function TodayGameCard() {
  const { session, loading: sessionLoading } = useSession();
  const { info, loading, error } = useTodayGame();

  if (loading || sessionLoading) return <Message>Cargando el juego de hoy…</Message>;
  if (error || !info || !info.today) return <Message>El juego de hoy no está disponible por el momento.</Message>;
  if (!session) return <GuestCard game={info.today} />;
  if (info.today === "hl") return <HigherLowerCard />;
  if (info.today === "circuit") return <DailyGameCard />;

  return <Message>Hoy no hay juego diario.</Message>;
}
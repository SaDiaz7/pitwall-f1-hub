import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { useDailyGame } from "@/hooks/useDailyGame";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/circuits";

export function DailyGameCard() {
  const { state, circuits, loading, error, isGuest } = useDailyGame();

  if (loading) {
    return (
      <section className="relative h-full overflow-hidden rounded-2xl border bg-hero p-6 md:p-8">
        <p className="text-sm text-muted-foreground">Cargando el juego de hoy…</p>
        <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
      </section>
    );
  }

  if (error || !state) {
    return (
      <section className="relative h-full overflow-hidden rounded-2xl border bg-hero p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Juego diario</p>
        <p className="mt-2 text-sm text-muted-foreground">El juego de hoy no está disponible por el momento.</p>
        <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
      </section>
    );
  }

  const attempts = state.guesses.length;
  const answerName = state.answerId ? (circuits.find((c) => c.id === state.answerId)?.name ?? "") : "";

  let status = "Todavía no jugaste hoy.";
  if (state.finished && state.solved) status = `¡Lo resolviste en ${attempts} ${attempts === 1 ? "intento" : "intentos"}!`;
  else if (state.finished) status = "Hoy no salió.";
  else if (attempts > 0) status = `Llevás ${attempts} de ${state.maxAttempts} intentos.`;

  const buttonLabel = state.finished
    ? "Ver resultado y compartir →"
    : attempts > 0
      ? "Seguir jugando →"
      : "Jugar ahora →";

  return (
    <section className="relative h-full overflow-hidden rounded-2xl border bg-hero p-6 md:p-8">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_16rem]">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Juego diario</p>
          <Link to="/juego" className="hover:text-primary">
            <h2 className="mt-2 text-4xl font-bold uppercase italic md:text-5xl">Adiviná el circuito</h2>
          </Link>
          <p className="mt-3 text-muted-foreground">
            Un circuito nuevo cada día. ¿Lo reconocés por su trazado?
          </p>
          <p className="mt-2 font-display text-xl font-semibold">{status}</p>
          {state.finished && answerName && (
            <p className="text-sm text-muted-foreground">
              Era <span className="font-semibold text-foreground">{answerName}</span>.
            </p>
          )}
          {!isGuest && state.streak > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <Flame className="h-4 w-4 text-orange-400" /> Racha: {state.streak}{" "}
              {state.streak === 1 ? "día" : "días"}
            </p>
          )}
          <Link
            to="/juego"
            className="mt-4 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            {buttonLabel}
          </Link>
        </div>

        <div className="h-36 text-primary md:h-44">
          <svg
            role="img"
            aria-label="Silueta del circuito de hoy"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="h-full w-full"
          >
            <path
              d={state.path}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
    </section>
  );
}
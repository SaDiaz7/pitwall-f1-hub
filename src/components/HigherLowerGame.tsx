import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Check, Flame, Share2, X } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { Button } from "@/components/ui/button";
import { useHigherLower } from "@/hooks/useHigherLower";
import {
  HL_STAT_LABELS,
  buildHlShareText,
  nationalityEs,
  type HlPick,
  type HlSubmitResult,
} from "@/lib/higher-lower";
import { cn } from "@/lib/utils";

type Message = { type: "ok" | "error"; text: string } | null;

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

// Número que sube contando hasta su valor.
function CountUp({ to, duration = 900 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (to === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);

  return <>{value}</>;
}

function verdict(score: number): string {
  if (score >= 10) return "¡Perfecto! Sabés de F1 como pocos.";
  if (score >= 8) return "¡Muy bien! Casi perfecto.";
  if (score >= 6) return "Bien, pero se puede mejorar.";
  if (score >= 3) return "Más o menos… ¡justo como el juego!";
  return "Hoy no fue tu día. Mañana hay revancha.";
}

export function HigherLowerGame({ onFinished }: { onFinished?: () => void }) {
  const { game, loading, error, isGuest, submit, advance } = useHigherLower();

  const [sending, setSending] = useState(false);
  const [reveal, setReveal] = useState<{ pick: HlPick; result: HlSubmitResult } | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const finished = game?.finished ?? false;
  useEffect(() => {
    if (finished) onFinished?.();
  }, [finished, onFinished]);

  if (loading) return <div className="skeleton h-72 w-full" />;

  if (isGuest) {
    return (
      <section className="fade-up rounded-2xl border border-primary/40 bg-hero p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Juego diario</p>
        <h2 className="mt-1 font-display text-2xl font-bold uppercase">¿Más o menos?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          10 duelos por día con estadísticas reales de pilotos de toda la historia. ¿Tiene más o menos victorias,
          podios, poles o títulos? Creá una cuenta para jugar y ganar sobres de cartas.
        </p>
        <Link
          to="/registro"
          className="mt-3 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        >
          Crear mi cuenta gratis
        </Link>
      </section>
    );
  }

  if (error || !game) {
    return <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error ?? "No pudimos cargar el juego."}</p>;
  }

  const current = game.current;
  const answered = game.rounds.length;
  const liveScore = reveal ? reveal.result.score : game.score;

  const onPick = async (pick: HlPick) => {
    if (!current || sending || reveal) return;
    setSending(true);
    setMessage(null);
    const response = await submit(current.round, pick);
    setSending(false);

    if (!response.ok) {
      setMessage({ type: "error", text: response.message });
      return;
    }
    setReveal({ pick, result: response.result });
  };

  const onNext = () => {
    if (!reveal) return;
    advance(reveal.pick, reveal.result);
    setReveal(null);
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(buildHlShareText(game));
      setMessage({ type: "ok", text: "Resultado copiado. ¡Pegalo donde quieras!" });
    } catch {
      setMessage({ type: "error", text: "No pudimos copiar el resultado." });
    }
  };

  const feedback = message && (
    <p
      className={cn(
        "rounded-md p-2 text-sm",
        message.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
      )}
    >
      {message.text}
    </p>
  );

  // ---------- Juego terminado ----------
  if (game.finished && !reveal) {
    return (
      <div className="space-y-5">
        {feedback}

        <section className="fade-up space-y-4 rounded-2xl border bg-card p-6 text-center" style={stagger(0)}>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">¿Más o menos?</p>
          <p className="font-display text-6xl font-bold tabular-nums">
            {game.score}
            <span className="text-2xl text-muted-foreground">/{game.total}</span>
          </p>
          <p className="text-sm text-muted-foreground">{verdict(game.score)}</p>
          {game.streak > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold">
              <Flame className="h-4 w-4 text-orange-400" /> Racha: {game.streak} {game.streak === 1 ? "día" : "días"}
            </p>
          )}
          <AnimatedBar percent={(game.score / game.total) * 100} className="mx-auto h-2 max-w-xs" />
          <div className="flex justify-center gap-1.5" aria-hidden="true">
            {game.rounds.map((round) => (
              <span
                key={round.round}
                className={cn("h-3 w-3 rounded-full", round.correct ? "bg-emerald-400" : "bg-red-400")}
              />
            ))}
          </div>
          <Button type="button" variant="outline" onClick={onShare} className="transition-transform active:scale-95">
            <Share2 className="mr-2 h-4 w-4" /> Copiar resultado
          </Button>
          <p className="text-xs text-muted-foreground">Mañana hay 10 duelos nuevos.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tus duelos</h2>
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {game.rounds.map((round, index) => (
              <li
                key={round.round}
                className="fade-up flex items-start gap-2 rounded-xl border bg-card p-3 text-sm"
                style={stagger(Math.min(index, 9))}
              >
                {round.correct ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {round.a_name} {round.a_value} → {round.b_name} {round.b_value}
                  </p>
                  <p className="text-xs text-muted-foreground">{HL_STAT_LABELS[round.stat]}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  if (!current) {
    return <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">No pudimos cargar el duelo.</p>;
  }

  // ---------- Duelo en juego ----------
  const statLabel = HL_STAT_LABELS[current.stat];
  const revealed = reveal !== null;

  return (
    <div className="space-y-5">
      {feedback}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <ol className="flex gap-1.5" aria-label="Progreso">
            {Array.from({ length: game.total }, (_, index) => {
              const played = game.rounds[index];
              const isCurrent = index === answered;
              const result = played ? played.correct : isCurrent && reveal ? reveal.result.correct : null;
              return (
                <li
                  key={index}
                  className={cn(
                    "h-3 w-3 rounded-full transition-colors",
                    result === true && "bg-emerald-400",
                    result === false && "bg-red-400",
                    result === null &&
                      (isCurrent ? "animate-pulse bg-primary motion-reduce:animate-none" : "bg-secondary"),
                  )}
                />
              );
            })}
          </ol>
          <p className="text-sm text-muted-foreground">
            Duelo {Math.min(answered + 1, game.total)}/{game.total} · {liveScore}{" "}
            {liveScore === 1 ? "acierto" : "aciertos"}
          </p>
        </div>
        <AnimatedBar percent={((answered + (revealed ? 1 : 0)) / game.total) * 100} />
      </div>

      <div key={current.round} className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
        <section className="fade-up rounded-2xl border bg-card p-5" style={stagger(0)}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Referencia</p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-none">{current.a_name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{nationalityEs(current.a_nationality) || "\u00a0"}</p>
          <p className="mt-6 font-display text-7xl font-bold leading-none tabular-nums text-primary">
            {current.a_value}
          </p>
          <p className="mt-1 text-sm uppercase tracking-wider text-muted-foreground">{statLabel}</p>
        </section>

        <div className="flex items-center justify-center">
          <span className="rounded-full border bg-background px-3 py-1 font-display text-sm font-bold">VS</span>
        </div>

        <section
          className={cn(
            "fade-up rounded-2xl border bg-card p-5 transition-colors duration-500",
            revealed && reveal.result.correct && "border-emerald-400/70 bg-emerald-500/10",
            revealed && !reveal.result.correct && "border-red-400/70 bg-red-500/10",
          )}
          style={stagger(1)}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            ¿Más o menos {statLabel}?
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-none">{current.b_name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{nationalityEs(current.b_nationality) || "\u00a0"}</p>
          <p className="mt-6 font-display text-7xl font-bold leading-none tabular-nums">
            {revealed ? <CountUp to={reveal.result.b_value} /> : "?"}
          </p>
          <p className="mt-1 text-sm uppercase tracking-wider text-muted-foreground">{statLabel}</p>

          {revealed ? (
            <div className="fade-up mt-5 space-y-3">
              <p
                className={cn(
                  "font-display text-xl font-bold uppercase",
                  reveal.result.correct ? "text-emerald-400" : "text-red-400",
                )}
              >
                {reveal.result.correct ? "¡Acertaste!" : "Esta vez no"}
              </p>
              <p className="text-sm text-muted-foreground">
                {current.b_name} tiene {reveal.result.b_value} y {current.a_name} {reveal.result.a_value}.
              </p>
              <Button
                type="button"
                onClick={onNext}
                className="w-full bg-gradient-primary font-semibold transition-transform active:scale-95"
              >
                {reveal.result.finished ? "Ver resultado →" : "Siguiente duelo →"}
              </Button>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={sending}
                onClick={() => void onPick("more")}
                className="bg-gradient-primary font-semibold transition-transform active:scale-95"
              >
                <ArrowUp className="mr-1.5 h-4 w-4" /> Más
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={sending}
                onClick={() => void onPick("less")}
                className="font-semibold transition-transform active:scale-95"
              >
                <ArrowDown className="mr-1.5 h-4 w-4" /> Menos
              </Button>
            </div>
          )}
        </section>
      </div>

      <p className="text-xs text-muted-foreground">
        Estadísticas de toda la historia de la F1. Poles = largadas desde el primer puesto de la grilla.
      </p>
    </div>
  );
}
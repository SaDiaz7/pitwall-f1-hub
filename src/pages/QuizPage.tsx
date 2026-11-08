import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, RotateCcw, Share2, X } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ROUND_SIZE, SECTION_LABELS, buildRound, levelFor, type PlayQuestion } from "@/lib/quiz";
import { cn } from "@/lib/utils";

export function QuizPage() {
  const [round, setRound] = useState<PlayQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const start = () => {
    setRound(buildRound());
    setIndex(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
    setFinished(false);
    setMessage(null);
  };

  const choose = (choiceIndex: number) => {
    if (!round || picked !== null) return;
    const question = round[index];
    if (!question) return;

    setPicked(choiceIndex);
    if (question.choices[choiceIndex]?.correct) {
      setScore((value) => value + 1);
    } else {
      setMissed((current) => (current.includes(question.section) ? current : [...current, question.section]));
    }
  };

  const next = () => {
    if (!round) return;
    if (index + 1 >= round.length) {
      setFinished(true);
    } else {
      setIndex((value) => value + 1);
      setPicked(null);
    }
  };

  const share = async (levelName: string) => {
    const text = `Saqué ${score}/${ROUND_SIZE} en el quiz de F1 de PitWall y soy ${levelName}. ¿Cuánto sabés vos? ${window.location.origin}/quiz`;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Resultado copiado. ¡Pegalo donde quieras!");
    } catch {
      setMessage("No pudimos copiar el resultado.");
    }
  };

  const header = (
    <PageHeader title="¿Cuánto sabés de F1?" subtitle="Ocho preguntas para saber qué nivel tenés." />
  );

  // Pantalla de inicio
  if (!round) {
    return (
      <>
        {header}
        <section className="rounded-2xl border bg-hero p-6 md:p-8">
          <p className="text-sm text-foreground/85">
            Te hacemos {ROUND_SIZE} preguntas al azar sobre cómo funciona la Fórmula 1: puntos, clasificación, banderas,
            neumáticos y más. Después de cada una te explicamos la respuesta. Al final te decimos qué nivel tenés: de
            Rookie a Campeón del mundo.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={start} className="bg-gradient-primary font-semibold">
              Empezar el quiz
            </Button>
            <Button asChild variant="outline">
              <Link to="/guia">Leer primero la guía</Link>
            </Button>
          </div>
        </section>
      </>
    );
  }

  // Resultado
  if (finished) {
    const level = levelFor(score, round.length);
    return (
      <>
        {header}
        <section className="fade-up space-y-4 rounded-2xl border bg-hero p-6 text-center md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tu resultado</p>
          <p className="font-display text-6xl font-bold tabular-nums leading-none">
            {score} <span className="text-3xl text-muted-foreground">/ {round.length}</span>
          </p>
          <p
            className={cn(
              "font-display text-4xl font-bold uppercase",
              level.champion ? "gold-text" : "text-primary",
            )}
          >
            {level.name}
          </p>
          <p className="mx-auto max-w-md text-sm text-foreground/85">{level.text}</p>

          {missed.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Para repasar:{" "}
              {missed.map((section, position) => (
                <span key={section}>
                  {position > 0 && " · "}
                  <Link to="/guia" hash={section} className="font-semibold text-primary hover:underline">
                    {SECTION_LABELS[section] ?? section}
                  </Link>
                </span>
              ))}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button type="button" onClick={() => share(level.name)} className="bg-gradient-primary font-semibold">
              <Share2 className="mr-2 h-4 w-4" /> Compartir
            </Button>
            <Button type="button" variant="outline" onClick={start}>
              <RotateCcw className="mr-2 h-4 w-4" /> Jugar de nuevo
            </Button>
            <Button asChild variant="outline">
              <Link to="/guia">Leer la guía</Link>
            </Button>
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </section>
      </>
    );
  }

  // Pregunta
  const question = round[index];
  if (!question) return null;

  const answered = picked !== null;
  const correctChoice = question.choices.find((choice) => choice.correct);
  const wasRight = answered && question.choices[picked]?.correct === true;
  const progress = Math.round((index / round.length) * 100);

  return (
    <>
      {header}

      <div className="mb-4 space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>
            Pregunta {index + 1} de {round.length}
          </span>
          <span>
            {score} {score === 1 ? "acierto" : "aciertos"}
          </span>
        </div>
        <AnimatedBar percent={progress} className="h-2" />
      </div>

      <section className="space-y-4 rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="font-display text-2xl font-bold leading-tight">{question.question}</h2>

        <ul className="space-y-2">
          {question.choices.map((choice, choiceIndex) => {
            const state = !answered ? "idle" : choice.correct ? "right" : picked === choiceIndex ? "wrong" : "dim";
            return (
              <li key={choice.text}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => choose(choiceIndex)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border bg-background/40 p-3 text-left text-sm",
                    state === "idle" && "card-link",
                    state === "right" && "border-success bg-success/15",
                    state === "wrong" && "border-destructive bg-destructive/15",
                    state === "dim" && "opacity-60",
                  )}
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary font-display text-sm font-bold">
                    {String.fromCharCode(65 + choiceIndex)}
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">{choice.text}</span>
                  {state === "right" && <Check className="h-5 w-5 shrink-0 text-success" />}
                  {state === "wrong" && <X className="h-5 w-5 shrink-0 text-destructive" />}
                </button>
              </li>
            );
          })}
        </ul>

        {answered && (
          <div className="fade-up space-y-3 rounded-xl border bg-background/40 p-4 text-sm">
            <p className="font-bold uppercase tracking-wide">
              {wasRight ? (
                <span className="text-success">¡Correcto!</span>
              ) : (
                <span className="text-destructive">No era esa.</span>
              )}
            </p>
            {!wasRight && correctChoice && (
              <p>
                La respuesta correcta era: <span className="font-semibold">{correctChoice.text}</span>
              </p>
            )}
            <p className="text-foreground/85">{question.explanation}</p>
            <p className="text-xs text-muted-foreground">
              Más en la guía:{" "}
              <Link to="/guia" hash={question.section} className="font-semibold text-primary hover:underline">
                {SECTION_LABELS[question.section] ?? question.section}
              </Link>
            </p>
            <Button type="button" onClick={next} className="bg-gradient-primary font-semibold">
              {index + 1 >= round.length ? "Ver mi resultado" : "Siguiente pregunta"}
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
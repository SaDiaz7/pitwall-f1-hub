import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Flame, Share2 } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGuessDriver } from "@/hooks/useGuessDriver";
import {
  DG_COLUMNS,
  buildDgShareText,
  dgCellValue,
  type DgColumn,
  type DgDriverOption,
  type DgFeedback,
  type DgHint,
} from "@/lib/dg";
import { cn } from "@/lib/utils";

type Message = { type: "ok" | "error"; text: string } | null;

const ROW = "grid grid-cols-[minmax(6.5rem,1.6fr)_repeat(7,minmax(2.9rem,1fr))] gap-1.5";

const HINT_STYLES: Record<DgHint, string> = {
  ok: "border-emerald-400/70 bg-emerald-500/20",
  no: "border-red-400/50 bg-red-500/10",
  up: "border-amber-400/60 bg-amber-500/10",
  down: "border-amber-400/60 bg-amber-500/10",
};

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function verdict(attempts: number): string {
  if (attempts <= 2) return "¡Increíble! Sabés de F1 como pocos.";
  if (attempts <= 4) return "¡Muy bien!";
  if (attempts <= 6) return "Bien jugado.";
  return "¡Justo a tiempo!";
}

function Cell({ column, feedback, index }: { column: DgColumn; feedback: DgFeedback; index: number }) {
  const hint = feedback.hints[column];
  const value = dgCellValue(feedback, column);
  const isText = column === "nationality";

  return (
    <div
      className={cn(
        "fade-up flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md border px-0.5 py-1 text-center",
        HINT_STYLES[hint],
      )}
      style={stagger(index)}
    >
      <span
        className={cn(
          "font-bold leading-tight",
          isText ? "break-words text-[10px] uppercase tracking-tight" : "font-display text-lg tabular-nums",
        )}
      >
        {value}
      </span>
      {hint === "up" && <ArrowUp className="h-3 w-3" aria-label="El piloto secreto tiene un valor mayor" />}
      {hint === "down" && <ArrowDown className="h-3 w-3" aria-label="El piloto secreto tiene un valor menor" />}
    </div>
  );
}

// El último intento va arriba.
function GuessTable({ guesses }: { guesses: DgFeedback[] }) {
  const rows = [...guesses].reverse();

  return (
    <div className="max-w-4xl overflow-x-auto rounded-2xl border bg-card p-3">
      <div className="min-w-[32rem] space-y-1.5">
        <div className={cn(ROW, "px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground")}>
          <span>Piloto</span>
          {DG_COLUMNS.map((column) => (
            <span key={column.key} className="text-center" title={column.title}>
              {column.label}
            </span>
          ))}
        </div>

        {rows.map((guess) => (
          <div key={guess.id} className={ROW}>
            <div
              className={cn(
                "flex min-h-12 items-center rounded-md border px-2 text-sm font-semibold",
                guess.correct ? "border-emerald-400/70 bg-emerald-500/20" : "bg-background/40",
              )}
            >
              <span className="truncate">{guess.name}</span>
            </div>
            {DG_COLUMNS.map((column, index) => (
              <Cell key={column.key} column={column.key} feedback={guess} index={index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuessDriverGame({ onFinished }: { onFinished?: () => void }) {
  const { game, drivers, loading, error, isGuest, submit } = useGuessDriver();

  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
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
        <h2 className="mt-1 font-display text-2xl font-bold uppercase">Adiviná el piloto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hay un piloto secreto por día. Probá con otros pilotos y las pistas (nacionalidad, edad, debut, victorias…)
          te ayudan a encontrarlo en 8 intentos. Creá una cuenta para jugar y ganar sobres de cartas.
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
    return (
      <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">
        {error ?? "No pudimos cargar el juego."}
      </p>
    );
  }

  const attempts = game.guesses.length;
  const guessedIds = new Set(game.guesses.map((guess) => guess.id));
  const term = normalize(query.trim());
  const suggestions: DgDriverOption[] =
    term === ""
      ? []
      : drivers.filter((driver) => !guessedIds.has(driver.id) && normalize(driver.name).includes(term)).slice(0, 6);

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

  const pick = async (driver: DgDriverOption) => {
    if (sending || game.finished) return;
    setSending(true);
    setMessage(null);
    const response = await submit(driver.id);
    setSending(false);

    if (!response.ok) {
      setMessage({ type: "error", text: response.message });
      return;
    }
    setQuery("");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const first = suggestions[0];
    if (first) void pick(first);
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(buildDgShareText(game));
      setMessage({ type: "ok", text: "Resultado copiado. ¡Pegalo donde quieras!" });
    } catch {
      setMessage({ type: "error", text: "No pudimos copiar el resultado." });
    }
  };

  // ---------- Juego terminado ----------
  if (game.finished) {
    const points = Math.max(7 - attempts, 1);

    return (
      <div className="space-y-5">
        {feedback}

        <section className="fade-up max-w-xl space-y-4 rounded-2xl border bg-card p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Adiviná el piloto</p>
          <h2 className="font-display text-4xl font-bold uppercase leading-none">
            {game.solved ? "¡Lo adivinaste!" : "No salió esta vez"}
          </h2>
          <p className="text-sm text-muted-foreground">
            El piloto de hoy era <span className="font-semibold text-foreground">{game.answer?.name ?? "—"}</span>.
          </p>

          {game.solved && (
            <>
              <p className="font-display text-6xl font-bold tabular-nums">
                {attempts}
                <span className="text-2xl text-muted-foreground">/{game.max_attempts}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {verdict(attempts)} Sumaste {points} {points === 1 ? "punto" : "puntos"} al ranking semanal.
              </p>
              <AnimatedBar
                percent={((game.max_attempts - attempts + 1) / game.max_attempts) * 100}
                className="mx-auto h-2 max-w-xs"
              />
            </>
          )}

          {game.streak > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold">
              <Flame className="h-4 w-4 text-orange-400" /> Racha: {game.streak} {game.streak === 1 ? "día" : "días"}
            </p>
          )}

          <Button type="button" variant="outline" onClick={onShare} className="transition-transform active:scale-95">
            <Share2 className="mr-2 h-4 w-4" /> Copiar resultado
          </Button>
          <p className="text-xs text-muted-foreground">Volvé mañana para el próximo juego.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tus intentos</h2>
          <GuessTable guesses={game.guesses} />
        </section>
      </div>
    );
  }

  // ---------- Juego en curso ----------
  return (
    <div className="space-y-5">
      {feedback}

      <div className="max-w-xl space-y-2">
        <div className="flex items-center justify-between gap-3">
          <ol className="flex gap-1.5" aria-label="Intentos">
            {Array.from({ length: game.max_attempts }, (_, index) => {
              const played = game.guesses[index];
              const isCurrent = index === attempts;
              return (
                <li
                  key={index}
                  className={cn(
                    "h-3 w-3 rounded-full transition-colors",
                    played
                      ? played.correct
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                      : isCurrent
                        ? "animate-pulse bg-primary motion-reduce:animate-none"
                        : "bg-secondary",
                  )}
                />
              );
            })}
          </ol>
          <p className="text-sm text-muted-foreground">
            Intento {Math.min(attempts + 1, game.max_attempts)}/{game.max_attempts}
          </p>
        </div>
        <AnimatedBar percent={(attempts / game.max_attempts) * 100} />
      </div>

      <section className="fade-up max-w-xl space-y-3 rounded-2xl border bg-card p-4">
        <label htmlFor="dg-input" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          ¿Quién es el piloto secreto?
        </label>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            id="dg-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Escribí un apellido…"
            autoComplete="off"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || suggestions.length === 0}
            className="bg-gradient-primary font-semibold transition-transform active:scale-95"
          >
            Probar
          </Button>
        </form>

        {suggestions.length > 0 && (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {suggestions.map((driver, index) => (
              <li key={driver.id} className="fade-up" style={stagger(index)}>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void pick(driver)}
                  className="w-full rounded-lg border bg-background/40 px-3 py-2 text-left text-sm font-semibold transition hover:bg-accent/40 active:scale-95 disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  {driver.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        {term !== "" && drivers.length > 0 && suggestions.length === 0 && (
          <p className="text-xs text-muted-foreground">No encontramos pilotos con ese nombre (o ya lo probaste).</p>
        )}
      </section>

      {attempts > 0 && <GuessTable guesses={game.guesses} />}

      <p className="max-w-4xl text-xs text-muted-foreground">
        Verde = coincide. ▲ = el piloto secreto tiene un valor mayor (más victorias, nació o debutó después). ▼ = menor.
        Los datos son de toda la historia de la F1.
      </p>
    </div>
  );
}
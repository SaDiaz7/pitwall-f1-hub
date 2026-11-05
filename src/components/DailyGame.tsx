import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Flame, Image as ImageIcon, Lock, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDailyGame } from "@/hooks/useDailyGame";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/circuits";
import { renderShareCard } from "@/lib/share-card";
import { CLUE_SLOTS, buildShareText, formatClue } from "@/lib/daily-game";
import { cn } from "@/lib/utils";

type Message = { type: "ok" | "error"; text: string } | null;

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function DailyGame({ onFinished }: { onFinished?: () => void }) {
  const { state, circuits, loading, error, isGuest, submit } = useDailyGame();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  
  const finished = state?.finished ?? false;
  useEffect(() => {
    if (finished) onFinished?.();
  }, [finished, onFinished]);

  const byId = useMemo(() => new Map(circuits.map((c) => [c.id, c])), [circuits]);

  const suggestions = useMemo(() => {
    if (!state || selectedId) return [];
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return circuits
      .filter((c) => !state.guesses.includes(c.id) && normalize(`${c.name} ${c.city}`).includes(q))
      .slice(0, 6);
  }, [state, circuits, query, selectedId]);

  if (error) {
    return <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>;
  }
  if (loading || !state) {
    return <p className="text-sm text-muted-foreground">Cargando el juego de hoy…</p>;
  }

  const answerName = state.answerId ? (byId.get(state.answerId)?.name ?? "") : "";

  const onGuess = async () => {
    if (!selectedId) return;
    setSending(true);
    setMessage(null);
    const result = await submit(selectedId);
    setSending(false);
    if (result.ok) {
      setQuery("");
      setSelectedId(null);
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText(state));
      setMessage({ type: "ok", text: "Resultado copiado. ¡Pegalo donde quieras!" });
    } catch {
      setMessage({ type: "error", text: "No pudimos copiar el resultado." });
    }
  };

  
  const onShareImage = async () => {
    setSharing(true);
    setMessage(null);
    try {
      const blob = await renderShareCard(state);
      const file = new File([blob], "pitwall-circuito.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: buildShareText(state) });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "pitwall-circuito.png";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage({ type: "ok", text: "Imagen descargada." });
      }
    } catch (shareError) {
      // Si la persona cierra el menú de compartir no es un error.
      if (!(shareError instanceof DOMException && shareError.name === "AbortError")) {
        console.error("Compartir imagen:", shareError);
        setMessage({ type: "error", text: "No pudimos generar la imagen." });
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-5">
      {message && (
        <p
          className={cn(
            "rounded-md p-2 text-sm",
            message.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {message.text}
        </p>
      )}

      <section className="rounded-2xl border bg-card p-4">
        <svg
          role="img"
          aria-label="Silueta del circuito de hoy"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="h-56 w-full text-primary"
        >
          <path
            d={state.path}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Intentos: {state.guesses.length}/{state.maxAttempts}
        </p>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Pistas</h2>
        <ul className="space-y-2">
          {CLUE_SLOTS.map((slot) => {
            const value = formatClue(slot.key, state.clues);
            return (
              <li key={slot.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{slot.label}</span>
                {value ? (
                  <span className="font-semibold">{value}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Lock className="h-3.5 w-3.5" /> Se desbloquea con el error {slot.unlocksAfter}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {state.guesses.length > 0 && (
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Tus intentos</h2>
          <ol className="space-y-1.5">
            {state.guesses.map((id, index) => {
              const isCorrect = state.solved && index === state.guesses.length - 1;
              return (
                <li key={id} className="flex items-center gap-2 text-sm">
                  {isCorrect ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                  <span className="truncate font-semibold">{byId.get(id)?.name ?? id}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {!state.finished ? (
        <section className="space-y-2 rounded-2xl border bg-card p-4">
          <label htmlFor="juego-circuito" className="text-sm font-semibold">
            ¿Qué circuito es?
          </label>
          <Input
            id="juego-circuito"
            value={query}
            placeholder="Escribí el nombre o la ciudad…"
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId(null);
            }}
          />

          {suggestions.length > 0 && (
            <ul className="overflow-hidden rounded-xl border">
              {suggestions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id);
                      setQuery(c.name);
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
                  >
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.city}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            onClick={onGuess}
            disabled={!selectedId || sending}
            className="w-full bg-gradient-primary font-semibold"
          >
            {sending ? "Probando…" : "Probar"}
          </Button>
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border bg-card p-5 text-center">
          <p className="font-display text-2xl font-bold uppercase">
            {state.solved ? "¡Lo adivinaste!" : "Hoy no salió"}
          </p>
          {answerName && (
            <p className="text-sm text-muted-foreground">
              El circuito era <span className="font-semibold text-foreground">{answerName}</span>.
            </p>
          )}
          {!isGuest && state.streak > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold">
              <Flame className="h-4 w-4 text-orange-400" /> Racha: {state.streak}{" "}
              {state.streak === 1 ? "día" : "días"}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={onShareImage} disabled={sharing} className="bg-gradient-primary font-semibold">
              <ImageIcon className="mr-2 h-4 w-4" /> {sharing ? "Generando…" : "Compartir imagen"}
            </Button>
            <Button type="button" variant="outline" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" /> Copiar texto
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Mañana hay un circuito nuevo.</p>
          {isGuest && (
            <p className="text-xs text-muted-foreground">
              <Link to="/registro" className="font-semibold text-primary hover:underline">
                Creá una cuenta
              </Link>{" "}
              para guardar tu racha.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
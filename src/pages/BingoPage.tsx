import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBingo } from "@/hooks/useBingo";
import { BINGO_CELLS, BINGO_IDEAS, MAX_CELL_LENGTH, countLines } from "@/lib/bingo";
import { cn } from "@/lib/utils";

type Message = { type: "ok" | "error"; text: string } | null;

const blankDrafts = () => Array.from({ length: BINGO_CELLS }, () => "");

export function BingoPage() {
  const season = new Date().getFullYear();
  const { cells, loading, error, saveCard, toggle } = useBingo(season);

  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<string[]>(blankDrafts);
  const [message, setMessage] = useState<Message>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const filled = cells.filter((c) => c !== null).length;
  const hasCard = filled > 0;

  // La primera vez que termina de cargar y no hay bingo, abre el editor.
  useEffect(() => {
    if (!loading && !initialized) {
      setInitialized(true);
      if (!hasCard) setEditing(true);
    }
  }, [loading, initialized, hasCard]);

  const startEditing = () => {
    setDrafts(cells.map((c) => c?.text ?? ""));
    setMessage(null);
    setEditing(true);
  };

  const fillWithIdeas = () => {
    const used = new Set(drafts.map((d) => d.trim()).filter(Boolean));
    const pool = BINGO_IDEAS.filter((idea) => !used.has(idea)).sort(() => Math.random() - 0.5);
    setDrafts(drafts.map((value) => (value.trim() === "" ? (pool.shift() ?? "") : value)));
  };

  const onSave = async () => {
    setMessage(null);
    if (drafts.every((d) => d.trim() === "")) {
      setMessage({ type: "error", text: "Escribí al menos una casilla." });
      return;
    }

    setSaving(true);
    const result = await saveCard(drafts);
    setSaving(false);

    if (result.ok) setEditing(false);
    else setMessage({ type: "error", text: result.message });
  };

  const onToggle = async (position: number) => {
    setMessage(null);
    const result = await toggle(position);
    if (!result.ok) setMessage({ type: "error", text: result.message });
  };

  const marked = cells.map((c) => c?.marked === true);
  const markedCount = marked.filter(Boolean).length;
  const lines = countLines(marked);
  const complete = filled === BINGO_CELLS && markedCount === BINGO_CELLS;

  return (
    <>
      <PageHeader title={`Bingo ${season}`} subtitle="Armá tus casillas y tachalas a medida que pasan en la temporada." />

      {error && <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}
      {message && (
        <p
          className={cn(
            "mb-4 rounded-md p-2 text-sm",
            message.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {message.text}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando tu bingo…</p>
      ) : editing ? (
        <section className="space-y-4 rounded-2xl border bg-card p-5">
          <div>
            <h2 className="text-xl font-bold uppercase">{hasCard ? "Editar tu bingo" : "Armá tu bingo"}</h2>
            <p className="text-sm text-muted-foreground">
              Escribí lo que creés que va a pasar (hasta {MAX_CELL_LENGTH} caracteres cada uno). Podés dejar casillas
              vacías y completarlas después. Si cambiás el texto de una casilla tachada, se destacha.
            </p>
          </div>

          <ol className="grid gap-2 sm:grid-cols-2">
            {drafts.map((value, position) => (
              <li key={position} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                  {position + 1}
                </span>
                <Input
                  value={value}
                  maxLength={MAX_CELL_LENGTH}
                  aria-label={`Casilla ${position + 1}`}
                  onChange={(e) => setDrafts((current) => current.map((d, i) => (i === position ? e.target.value : d)))}
                />
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={onSave} disabled={saving} className="bg-gradient-primary font-semibold">
              {saving ? "Guardando…" : "Guardar bingo"}
            </Button>
            <Button type="button" variant="outline" onClick={fillWithIdeas}>
              Completar con ideas
            </Button>
            {hasCard && (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-bold">{markedCount}</span> de {filled} casillas tachadas ·{" "}
              <span className="font-bold">{lines}</span> {lines === 1 ? "línea completa" : "líneas completas"}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={startEditing}>
              Editar casillas
            </Button>
          </div>

          {complete && (
            <p className="rounded-2xl bg-gradient-primary p-4 text-center font-display text-2xl font-bold uppercase text-primary-foreground">
              ¡Bingo! Completaste las 25 casillas
            </p>
          )}

          <ul className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {cells.map((cell, position) => (
              <li key={position}>
                {cell ? (
                  <button
                    type="button"
                    onClick={() => onToggle(position)}
                    aria-pressed={cell.marked}
                    title={cell.text}
                    className={cn(
                      "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border p-1 text-center text-[10px] font-semibold leading-tight transition-colors sm:p-2 sm:text-xs",
                      cell.marked ? "border-primary bg-primary/20" : "bg-card hover:border-primary/50",
                    )}
                  >
                    <span className={cn("line-clamp-5", cell.marked && "text-muted-foreground line-through")}>
                      {cell.text}
                    </span>
                    {cell.marked && <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-primary" />}
                  </button>
                ) : (
                  <div className="aspect-square rounded-lg border border-dashed bg-card/30" />
                )}
              </li>
            ))}
          </ul>

          <details className="rounded-2xl border bg-card p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Ver todas las casillas completas</summary>
            <ol className="mt-3 space-y-1.5">
              {cells.map((cell, position) =>
                cell ? (
                  <li key={position} className="flex gap-2">
                    <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{position + 1}</span>
                    <span className={cn(cell.marked && "text-muted-foreground line-through")}>{cell.text}</span>
                  </li>
                ) : null,
              )}
            </ol>
          </details>
        </div>
      )}
    </>
  );
}
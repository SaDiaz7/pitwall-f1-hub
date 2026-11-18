import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { StickerCard } from "@/components/StickerCard";
import { Button } from "@/components/ui/button";
import { useAlbum } from "@/hooks/useAlbum";
import { supabase } from "@/integrations/supabase/client";
import { KIND_LABELS, KIND_ORDER, RARITY_RANK, type CardKind } from "@/lib/album";
import { cn } from "@/lib/utils";

const MAX = 6;

const KNOWN_ERRORS = [
  "Podés elegir hasta 6 cartas",
  "Solo podés elegir cartas que tenés",
  "Hay cartas repetidas en tu selección",
];

export function ShowcasePicker({
  initial,
  onClose,
  onSaved,
}: {
  initial: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { entries, loading } = useAlbum();

  const [selected, setSelected] = useState<string[]>(initial);
  const [kind, setKind] = useState<CardKind | "all">("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const owned = useMemo(() => entries.filter((entry) => entry.quantity + entry.foil_quantity > 0), [entries]);
  const byId = useMemo(() => new Map(owned.map((entry) => [entry.card_id, entry])), [owned]);
  const visible = useMemo(
    () =>
      owned
        .filter((entry) => kind === "all" || entry.kind === kind)
        .sort((a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] || a.name.localeCompare(b.name, "es")),
    [owned, kind],
  );

  const toggle = (id: string) => {
    setError(null);
    if (!selected.includes(id) && selected.length >= MAX) {
      setError("Ya elegiste 6. Sacá una para poner otra.");
      return;
    }
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const move = (index: number, delta: number) => {
    setSelected((current) => {
      const target = index + delta;
      const a = current[index];
      const b = current[target];
      if (a === undefined || b === undefined) return current;
      const next = [...current];
      next[index] = b;
      next[target] = a;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("set_profile_showcase", { p_cards: selected });
    setSaving(false);

    if (rpcError) {
      console.error("Guardar cartas destacadas:", rpcError);
      setError(KNOWN_ERRORS.find((known) => rpcError.message.includes(known)) ?? "No pudimos guardar. Probá de nuevo.");
      return;
    }
    onSaved();
  };

  return (
    <div className="fade-up mt-4 space-y-4 rounded-xl border bg-secondary/20 p-4">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">Tus cartas destacadas</h3>
        <p className="text-xs text-muted-foreground">
          Elegí hasta 6. Se muestran primero y en este orden. Si elegís menos, se completa con tus cartas más raras.
        </p>
      </div>

      <ol className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: MAX }, (_, index) => {
          const id = selected[index];
          const entry = id ? byId.get(id) : undefined;

          return (
            <li key={index} className="w-24 shrink-0 sm:w-28">
              {entry ? (
                <div className="space-y-1.5">
                  <StickerCard card={entry} foil={entry.foil_quantity > 0} />
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <button
                      type="button"
                      aria-label="Mover antes"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="rounded p-1 text-muted-foreground transition-transform hover:text-foreground active:scale-90 disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-4 text-center font-bold tabular-nums">{index + 1}</span>
                    <button
                      type="button"
                      aria-label="Mover después"
                      disabled={index === selected.length - 1}
                      onClick={() => move(index, 1)}
                      className="rounded p-1 text-muted-foreground transition-transform hover:text-foreground active:scale-90 disabled:opacity-30"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Sacar"
                      onClick={() => toggle(entry.card_id)}
                      className="rounded p-1 text-muted-foreground transition-transform hover:text-destructive active:scale-90"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[5/7] items-center justify-center rounded-xl border-2 border-dashed font-display text-lg text-muted-foreground/60">
                  {index + 1}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        {(["all", ...KIND_ORDER] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setKind(option)}
            aria-pressed={kind === option}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition active:scale-95",
              kind === option
                ? "border-primary/60 bg-primary/15 text-primary"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {option === "all" ? "Todas" : KIND_LABELS[option]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton h-40 w-full" />
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenés cartas de este tipo todavía.</p>
      ) : (
        <ul className="grid max-h-[28rem] grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-3 overflow-y-auto p-2">
          {visible.map((entry) => {
            const position = selected.indexOf(entry.card_id);
            const isSelected = position !== -1;

            return (
              <li key={entry.card_id}>
                <button
                  type="button"
                  onClick={() => toggle(entry.card_id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative block w-full rounded-[7%] transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  <StickerCard card={entry} foil={entry.foil_quantity > 0} />
                  {isSelected && (
                    <span className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
                      {position + 1}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="bg-gradient-primary font-semibold transition-transform active:scale-95"
        >
          {saving ? "Guardando…" : "Guardar destacadas"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="transition-transform active:scale-95">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
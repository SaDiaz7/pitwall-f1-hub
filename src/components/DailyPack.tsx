import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { useDailyPack } from "@/hooks/useDailyPack";
import { KIND_LABELS, RARITY_LABELS, type Rarity } from "@/lib/album";
import { cn } from "@/lib/utils";

const RARITY_STYLE: Record<Rarity, string> = {
  common: "border-border",
  rare: "border-sky-400/60 bg-sky-400/5",
  epic: "border-purple-400/60 bg-purple-400/5",
  legendary: "border-amber-400/70 bg-amber-400/5",
};

const RARITY_TEXT: Record<Rarity, string> = {
  common: "text-muted-foreground",
  rare: "text-sky-300",
  epic: "text-purple-300",
  legendary: "text-amber-300",
};

export function DailyPack({ refreshKey }: { refreshKey: number }) {
  const { isGuest, status, cards, opening, error, open } = useDailyPack(refreshKey);

  if (isGuest) {
    return (
      <section className="fade-up rounded-2xl border border-primary/40 bg-hero p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Álbum de cartas</p>
        <h2 className="mt-1 font-display text-2xl font-bold uppercase">Ganá sobres jugando todos los días</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuanto antes adivinés el circuito, mejores cartas te tocan. Creá una cuenta para guardar tu colección.
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

  if (status === null) {
    return <div className="skeleton h-28 w-full" />;
  }

  if (status === "not_ready") {
    return (
      <section className="rounded-2xl border border-dashed bg-card/40 p-5 text-sm text-muted-foreground">
        Terminá el juego de hoy (ganando o agotando los intentos) para abrir tu sobre de cartas.
      </section>
    );
  }

  if (status === "available") {
    return (
      <section className="fade-up space-y-3 rounded-2xl border border-primary/60 bg-hero p-5 shadow-glow">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Tu sobre de hoy está listo</p>
        <h2 className="font-display text-3xl font-bold uppercase">¡Abrilo!</h2>
        {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}
        <button
          type="button"
          onClick={() => void open()}
          disabled={opening}
          className="inline-flex items-center rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        >
          {opening ? "Abriendo…" : "Abrir mi sobre"}
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold uppercase">Tu sobre de hoy</h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-3">
        {cards.map((card, index) => (
          <li
            key={`${card.card_id}-${index}`}
            className={cn("fade-up rounded-2xl border p-3", RARITY_STYLE[card.rarity])}
            style={{ "--i": Math.min(index, 8) } as CSSProperties}
          >
            <p className={cn("text-[11px] font-bold uppercase tracking-wider", RARITY_TEXT[card.rarity])}>
              {RARITY_LABELS[card.rarity]}
              {card.foil && " · ✨ Foil"}
            </p>
            <p className="mt-1 font-display text-lg font-bold uppercase leading-tight">{card.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {KIND_LABELS[card.kind]}
              {card.subtitle ? ` · ${card.subtitle}` : ""}
            </p>
            {card.is_new && (
              <span className="mt-2 inline-block rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                ¡Nueva!
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Pronto: tu álbum con las cartas dibujadas y el intercambio con amigos.</p>
    </section>
  );
}
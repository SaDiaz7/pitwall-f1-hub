import { useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { PackArt, PackReveal } from "@/components/DailyPack";
import { StickerCard } from "@/components/StickerCard";
import { useHlPack } from "@/hooks/useHlPack";

type Phase = "idle" | "shaking" | "reveal";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,9.5rem),1fr))] gap-4";

export function HigherLowerPack({ refreshKey }: { refreshKey: number }) {
  const { isGuest, status, cards, error, open } = useHlPack(refreshKey);
  const [phase, setPhase] = useState<Phase>("idle");

  const onOpen = async () => {
    setPhase("shaking");
    const [ok] = await Promise.all([open(), wait(900)]);
    setPhase(ok ? "reveal" : "idle");
  };

  // Los visitantes ya ven la invitación a registrarse dentro del juego.
  if (isGuest) return null;

  if (status === null) return <div className="skeleton h-40 w-full" />;

  if (phase === "shaking") {
    return (
      <section className="space-y-3 py-2 text-center">
        <PackArt shaking />
        <p className="text-sm font-semibold text-muted-foreground">Abriendo…</p>
      </section>
    );
  }

  if (phase === "reveal") return <PackReveal cards={cards} title="Tu sobre de ¿Más o menos?" />;

  if (status === "not_ready") {
    return (
      <section className="rounded-2xl border border-dashed bg-card/40 p-5 text-sm text-muted-foreground">
        Terminá los 10 duelos de hoy para abrir tu sobre de cartas.
      </section>
    );
  }

  if (status === "available") {
    return (
      <section className="fade-up space-y-4 rounded-2xl border border-primary/60 bg-hero p-5 text-center shadow-glow">
        <PackArt />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Tu sobre de ¿Más o menos? está listo</p>
          <h2 className="font-display text-3xl font-bold uppercase">¡Abrilo!</h2>
        </div>
        {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}
        <button
          type="button"
          onClick={() => void onOpen()}
          className="inline-flex items-center rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        >
          Abrir mi sobre
        </button>
      </section>
    );
  }

  // Ya lo abriste hoy: se ven las cartas que te tocaron.
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold uppercase">Tu sobre de hoy</h2>
        <Link to="/album" className="text-sm font-semibold text-primary hover:underline">
          Ver mi álbum →
        </Link>
      </div>
      <ul className={GRID}>
        {cards.map((card, index) => (
          <li key={`${card.card_id}-${index}`} className="fade-up" style={{ "--i": Math.min(index, 8) } as CSSProperties}>
            <StickerCard card={card} foil={card.foil} />
          </li>
        ))}
      </ul>
    </section>
  );
}
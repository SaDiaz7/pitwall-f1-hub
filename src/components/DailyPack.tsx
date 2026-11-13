import { useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { CardBack, StickerCard } from "@/components/StickerCard";
import { useDailyPack } from "@/hooks/useDailyPack";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { statStr, type AlbumCard } from "@/lib/album";
import type { DriverPhoto } from "@/lib/f1";
import { cn } from "@/lib/utils";

type Phase = "idle" | "shaking" | "reveal";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,9.5rem),1fr))] gap-4";

export function PackArt({ shaking = false }: { shaking?: boolean }) {
  return (
    <div className={cn("mx-auto w-36 sm:w-44", shaking && "pack-shake")} style={{ filter: "drop-shadow(0 10px 24px rgba(225,6,0,0.35))" }}>
      <CardBack />
    </div>
  );
}

export function PackReveal({
  cards,
  photos,
  title = "Tu sobre de hoy",
}: {
  cards: AlbumCard[];
  photos: Record<string, DriverPhoto | null | undefined>;
  title?: string;
}) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const flip = (index: number) => setFlipped((previous) => new Set(previous).add(index));
  const revealAll = () => cards.forEach((_, index) => window.setTimeout(() => flip(index), index * 250));

  const allFlipped = flipped.size === cards.length;
  const news = cards.filter((card) => card.is_new).length;
  const foils = cards.filter((card) => card.foil).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold uppercase">{title}</h2>
        {!allFlipped && (
          <button
            type="button"
            onClick={revealAll}
            className="rounded-lg border px-4 py-1.5 text-sm font-semibold transition hover:bg-accent/40 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            Revelar todas
          </button>
        )}
      </div>

      <ul className={GRID}>
        {cards.map((card, index) => {
          const isFlipped = flipped.has(index);

          return (
            <li key={`${card.card_id}-${index}`} className="pack-pop" style={{ "--i": index } as CSSProperties}>
              <button
                type="button"
                onClick={() => flip(index)}
                disabled={isFlipped}
                aria-label={isFlipped ? card.name : "Dar vuelta la carta"}
                className="block w-full"
                style={{ perspective: 1000 }}
              >
                <div
                  className="relative w-full transition-transform duration-700 motion-reduce:transition-none"
                  style={{
                    aspectRatio: "5 / 7",
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "none",
                  }}
                >
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                    <CardBack />
                  </div>
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <StickerCard card={card} foil={card.foil} photo={photos[card.card_id] ?? null} />
                    {card.is_new && (
                      <span className="absolute left-2 top-2 z-10 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground shadow">
                        ¡Nueva!
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {allFlipped ? (
        <div className="fade-up flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border bg-card p-4 text-sm">
          <p>
            <span className="font-semibold">{news}</span> {news === 1 ? "carta nueva" : "cartas nuevas"} ·{" "}
            <span className="font-semibold">{cards.length - news}</span>{" "}
            {cards.length - news === 1 ? "repetida" : "repetidas"}
            {foils > 0 && (
              <>
                {" · "}
                <span className="font-semibold">{foils}</span> foil ✨
              </>
            )}
          </p>
          <Link to="/album" className="font-semibold text-primary hover:underline">
            Ver mi álbum →
          </Link>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Tocá cada carta para darla vuelta.</p>
      )}
    </section>
  );
}

export function DailyPack({ refreshKey }: { refreshKey: number }) {
  const { isGuest, status, cards, error, open } = useDailyPack(refreshKey);
  const [phase, setPhase] = useState<Phase>("idle");

  const photos = useDriverPhotos(
    cards
      .filter((card) => card.kind === "driver")
      .map((card) => ({ id: card.card_id, wikiUrl: statStr(card.stats, "wiki_url") })),
  );

  const onOpen = async () => {
    setPhase("shaking");
    const [ok] = await Promise.all([open(), wait(900)]);
    setPhase(ok ? "reveal" : "idle");
  };

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

  if (status === null) return <div className="skeleton h-40 w-full" />;

  if (phase === "shaking") {
    return (
      <section className="space-y-3 py-2 text-center">
        <PackArt shaking />
        <p className="text-sm font-semibold text-muted-foreground">Abriendo…</p>
      </section>
    );
  }

  if (phase === "reveal") return <PackReveal cards={cards} photos={photos} />;

  if (status === "not_ready") {
    return (
      <section className="rounded-2xl border border-dashed bg-card/40 p-5 text-sm text-muted-foreground">
        Terminá el juego de hoy (ganando o agotando los intentos) para abrir tu sobre de cartas.
      </section>
    );
  }

  if (status === "available") {
    return (
      <section className="fade-up space-y-4 rounded-2xl border border-primary/60 bg-hero p-5 text-center shadow-glow">
        <PackArt />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Tu sobre de hoy está listo</p>
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
            <StickerCard card={card} foil={card.foil} photo={photos[card.card_id] ?? null} />
          </li>
        ))}
      </ul>
    </section>
  );
}
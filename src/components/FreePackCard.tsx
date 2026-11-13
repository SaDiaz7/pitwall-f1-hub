import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PackArt, PackReveal } from "@/components/DailyPack";
import { CardBack } from "@/components/StickerCard";
import { useFreePack } from "@/hooks/useFreePack";
import { useNow } from "@/hooks/useNow";
import { formatRemaining } from "@/lib/countdown";

type Phase = "idle" | "shaking" | "reveal";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// El día de PitWall cambia a medianoche de Argentina (UTC-3).
function msUntilNextDay(now: number): number {
  const local = now - 3 * HOUR;
  return (Math.floor(local / DAY) + 1) * DAY - local;
}

export function FreePackCard() {
  const { sessionLoading, isGuest, status, cards, error, open } = useFreePack();
  const now = useNow(30_000);
  const [phase, setPhase] = useState<Phase>("idle");

  const onOpen = async () => {
    setPhase("shaking");
    const [ok] = await Promise.all([open(), wait(900)]);
    setPhase(ok ? "reveal" : "idle");
  };

  if (sessionLoading) return null;

  if (isGuest) {
    return (
      <section className="fade-up mt-10 flex flex-wrap items-center gap-5 rounded-2xl border border-primary/40 bg-hero p-5">
        <div className="w-20 shrink-0 -rotate-6 sm:w-24">
          <CardBack />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Álbum de cartas</p>
          <h2 className="font-display text-2xl font-bold uppercase md:text-3xl">Un sobre gratis todos los días</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá tu cuenta y juntá pilotos, escuderías y circuitos. Intercambialos con tus amigos.
          </p>
          <Link
            to="/registro"
            className="mt-3 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            Crear mi cuenta gratis
          </Link>
        </div>
      </section>
    );
  }

  if (status === null) return <div className="skeleton mt-10 h-32 w-full" />;

  if (phase === "shaking") {
    return (
      <section className="mt-10 space-y-3 py-2 text-center">
        <PackArt shaking />
        <p className="text-sm font-semibold text-muted-foreground">Abriendo…</p>
      </section>
    );
  }

  if (phase === "reveal") {
    return (
      <div className="mt-10">
        <PackReveal cards={cards} photos={{}} title="Tu sobre gratis" />
      </div>
    );
  }

  if (status === "claimed") {
    return (
      <section className="fade-up mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-3 text-sm">
        <p>
          <span className="font-semibold">Sobre gratis de hoy reclamado ✓</span>{" "}
          <span className="text-muted-foreground">
            · El próximo en {now === null ? "unas horas" : formatRemaining(msUntilNextDay(now))}
          </span>
        </p>
        <Link to="/album" className="font-semibold text-primary hover:underline">
          Ver mi álbum →
        </Link>
      </section>
    );
  }

  return (
    <section className="fade-up mt-10 flex flex-wrap items-center gap-5 rounded-2xl border border-primary/50 bg-hero p-5 shadow-glow">
      <div className="w-20 shrink-0 -rotate-6 sm:w-24">
        <CardBack />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Sobre gratis de hoy</p>
        <h2 className="font-display text-2xl font-bold uppercase md:text-3xl">5 cartas te esperan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Uno nuevo todos los días, sin jugar. Si ganás el juego diario, te tocan mejores cartas.
        </p>
        {error && <p className="mt-2 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}
        <button
          type="button"
          onClick={() => void onOpen()}
          className="mt-3 inline-flex items-center rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        >
          Reclamar mi sobre
        </button>
      </div>
    </section>
  );
}
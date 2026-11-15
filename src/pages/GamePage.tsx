import { useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DailyGame } from "@/components/DailyGame";
import { DailyPack } from "@/components/DailyPack";
import { GameLeaderboard } from "@/components/GameLeaderboard";
import { HigherLowerGame } from "@/components/HigherLowerGame";
import { HigherLowerPack } from "@/components/HigherLowerPack";
import { PageHeader } from "@/components/PageHeader";
import { WeekStrip } from "@/components/WeekStrip";
import { useSession } from "@/hooks/useSession";
import { useTodayGame } from "@/hooks/useTodayGame";
import { GAME_LABELS } from "@/lib/games";

const SUBTITLES: Record<string, string> = {
  circuit: "Hoy toca adivinar el circuito. ¿Lo reconocés por su trazado?",
  hl: "Hoy toca ¿Más o menos?: 10 duelos con estadísticas reales de pilotos.",
};

const DEFAULT_SUBTITLE = "Un desafío nuevo cada día. Jugá, ganá sobres y completá tu álbum.";

function GuestInvite({ game }: { game: string }) {
  return (
    <section className="fade-up rounded-2xl border border-primary/40 bg-hero p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Juego diario</p>
      <h2 className="mt-1 font-display text-2xl font-bold uppercase">{GAME_LABELS[game] ?? "Juego de hoy"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cada día hay un juego distinto y un sobre de cartas para quien lo completa. Creá una cuenta gratis para jugar,
        guardar tu racha y completar tu álbum.
      </p>
      <Link
        to="/registro"
        className="mt-3 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        Crear mi cuenta gratis
      </Link>
      <p className="mt-2 text-xs text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </section>
  );
}

export function GamePage() {
  const { session, loading: sessionLoading } = useSession();
  const { info, loading, error } = useTodayGame();

  // Al terminar la partida, el ranking y el sobre se vuelven a cargar solos.
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const today = info?.today ?? null;
  const subtitle = today ? (SUBTITLES[today] ?? DEFAULT_SUBTITLE) : DEFAULT_SUBTITLE;

  return (
    <>
      <PageHeader title="Juego diario" subtitle={subtitle} />

      {loading || sessionLoading ? (
        <div className="skeleton h-72 w-full" />
      ) : error || !info ? (
        <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">
          No pudimos cargar el juego de hoy. Probá de nuevo en un rato.
        </p>
      ) : (
        <div className="space-y-6">
          <WeekStrip info={info} />

          {!today ? (
            <p className="text-sm text-muted-foreground">Hoy no hay juego diario. ¡Volvé mañana!</p>
          ) : !session ? (
            <GuestInvite game={today} />
          ) : today === "circuit" ? (
            <>
              <DailyGame onFinished={refresh} />
              <div className="max-w-3xl">
                <DailyPack refreshKey={version} />
              </div>
            </>
          ) : today === "hl" ? (
            <>
              <HigherLowerGame onFinished={refresh} />
              <div className="max-w-3xl">
                <HigherLowerPack refreshKey={version} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Hoy no hay juego diario. ¡Volvé mañana!</p>
          )}

          <GameLeaderboard refreshKey={version} />
        </div>
      )}
    </>
  );
}
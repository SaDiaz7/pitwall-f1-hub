import { LiveLinks } from "@/components/LiveLinks";
import { useNow } from "@/hooks/useNow";
import { formatRemaining } from "@/lib/countdown";
import type { GrandPrix } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOUR = 3_600_000;
const SOON_MS = 90 * 60_000; // se avisa desde 90 minutos antes

// Cartel de "sesión en vivo" o "sesión por empezar". Si no hay ninguna, no muestra nada.
export function LiveBanner({ gp, className }: { gp: GrandPrix; className?: string | undefined }) {
  const now = useNow(15_000);
  if (now === null) return null;

  const items = gp.sessions.map((session) => {
    const start = Date.parse(session.start);
    const end = start + (session.name === "Carrera" ? 2 * HOUR : HOUR);
    return { name: session.name, start, end };
  });

  const live = items.find((item) => now >= item.start && now < item.end);
  const upcoming = items.find((item) => item.start > now);
  const soon = !live && upcoming && upcoming.start - now <= SOON_MS ? upcoming : undefined;

  if (!live && !soon) return null;

  return (
    <section
      className={cn(
        "rounded-2xl border p-4 md:p-5",
        live ? "border-primary/60 bg-hero shadow-glow" : "border-amber-400/40 bg-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {live ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            En vivo
          </span>
        ) : (
          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
            Por empezar
          </span>
        )}
        <p className="font-display text-xl font-bold uppercase">{live ? live.name : soon?.name}</p>
        <p className="text-sm text-muted-foreground">
          {gp.name}
          {soon ? ` · empieza en ${formatRemaining(soon.start - now)}` : ""}
        </p>
      </div>

      <LiveLinks className="mt-3" />
      <p className="mt-2 text-xs text-muted-foreground">
        Los links abren sitios externos. El dashboard es un proyecto de terceros, sin relación con la F1.
      </p>
    </section>
  );
}
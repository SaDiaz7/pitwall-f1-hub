import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { formatRemaining } from "@/lib/countdown";
import type { GrandPrix } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// Se muestra en la zona horaria del navegador de cada persona.
const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

type SessionState = "done" | "live" | "upcoming";

function Dot({ state }: { state: SessionState }) {
  if (state === "done") {
    return (
      <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (state === "live") {
    return (
      <span className="absolute left-0 top-0.5 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
      </span>
    );
  }
  return <span className="absolute left-0 top-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground/50 bg-card" />;
}

export function WeekendCard({ gp }: { gp: GrandPrix }) {
  const now = useNow(30_000);

  const items = gp.sessions.map((session) => {
    const start = Date.parse(session.start);
    const end = start + (session.name === "Carrera" ? 2 * HOUR : HOUR);
    const state: SessionState = now === null ? "upcoming" : now >= end ? "done" : now >= start ? "live" : "upcoming";
    return { name: session.name, start, state };
  });

  const live = items.find((item) => item.state === "live");
  const upcoming = items.find((item) => item.state === "upcoming");
  const doneCount = items.filter((item) => item.state === "done").length;
  const progress = items.length === 0 ? 0 : ((doneCount + (live ? 0.5 : 0)) / items.length) * 100;

  const firstStart = items[0]?.start ?? null;
  const title =
    now !== null && firstStart !== null && firstStart - now > 6 * DAY ? "Próximo fin de semana" : "Este fin de semana";

  let status: ReactNode = null;
  if (now !== null && items.length > 0) {
    if (live) {
      status = <span className="font-semibold text-primary">En vivo ahora: {live.name}</span>;
    } else if (upcoming) {
      status = (
        <>
          Próxima: <span className="font-semibold text-foreground">{upcoming.name}</span> · en{" "}
          {formatRemaining(upcoming.start - now)}
        </>
      );
    } else {
      status = "El fin de semana ya terminó.";
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">{title}</h2>
        <Link
          to="/gp/$round"
          params={{ round: String(gp.round) }}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Ver detalles
        </Link>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <p className="font-display text-xl font-bold uppercase">{gp.name}</p>
        <p className="text-sm text-muted-foreground">
          {gp.circuit} · {gp.country}
        </p>
        <p className="mt-2 min-h-5 text-sm text-muted-foreground">{status}</p>

        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Los horarios todavía no están confirmados.</p>
        ) : (
          <ol className="relative mt-4 space-y-3">
            <span aria-hidden className="absolute bottom-2 left-2 top-2 w-px bg-border" />
            <span
              aria-hidden
              className="absolute left-2 top-2 w-px bg-primary transition-[height] duration-1000 ease-out"
              style={{ height: `${progress}%` }}
            />
            {items.map((item, index) => (
              <li
                key={item.start}
                style={{ "--i": index } as CSSProperties}
                className="fade-up relative pl-8"
              >
                <Dot state={item.state} />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span
                    className={cn(
                      "truncate",
                      item.name === "Carrera" ? "font-bold" : "font-semibold",
                      item.state === "done" && "text-muted-foreground",
                      item.state === "live" && "text-primary",
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {now === null ? "—" : timeFormatter.format(item.start)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-3 text-xs text-muted-foreground">Horarios en tu zona horaria.</p>
      </div>
    </section>
  );
}
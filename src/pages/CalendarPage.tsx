import { useEffect, useRef } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { CircuitMap } from "@/components/CircuitMap";
import { PageHeader } from "@/components/PageHeader";
import { SessionsList } from "@/components/SessionsList";
import { StatusBadge } from "@/components/StatusBadge";
import type { PodiumEntry } from "@/lib/f1";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamStripe } from "@/components/TeamStripe";

const route = getRouteApi("/_privado/calendario");

function Podium({ entries }: { entries?: PodiumEntry[] | undefined }) {
  if (!entries || entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Resultados no disponibles por el momento.</p>
    );
  }

  return (
    <ol className="space-y-1.5">
      {entries.map((entry) => (
        <li key={entry.position} className="flex items-center gap-3 text-sm">
          <span
            className={cn(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold",
              entry.position === 1 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            {entry.position}
          </span>
          <TeamStripe teamName={entry.teamName} className="h-5" />
          <span className="min-w-0 flex-1 truncate font-semibold">{entry.name}</span>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            {entry.teamName}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function CalendarPage() {
  const { grandsPrix, podiums } = route.useLoaderData();
  const nextRound = grandsPrix.find((gp) => gp.status === "proximo")?.round;
  const nextRef = useRef<HTMLElement | null>(null);

  // Al entrar, baja hasta la próxima carrera.
  useEffect(() => {
    nextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      <PageHeader
        title="Calendario"
        subtitle={`${grandsPrix.length} Grandes Premios esta temporada.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {grandsPrix.map((gp) => {
          const isNext = gp.round === nextRound;

          return (
            <article
              key={gp.id}
              ref={isNext ? nextRef : undefined}
              className={cn(
                "scroll-mt-20 overflow-hidden rounded-2xl border bg-card",
                isNext && "border-primary/60 shadow-glow",
              )}
            >
              <header className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  {isNext && (
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                      Próxima carrera
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Ronda {gp.round} · {gp.country}
                  </p>
                  <Link
                    to="/gp/$round"
                    params={{ round: String(gp.round) }}
                    className="hover:text-primary"
                  >
                    <h2 className="font-display text-xl font-bold uppercase leading-tight">
                      {gp.name}
                    </h2>
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">{gp.circuit}</p>
                  <p className="text-sm font-semibold">
                    {formatDate(gp.date, { day: "numeric", month: "long" })}
                  </p>
                </div>
                <StatusBadge status={gp.status} />
              </header>

              <div className="h-36 px-4 text-primary">
                <CircuitMap lat={gp.lat} lng={gp.lng} label={gp.circuit} />
              </div>

              <div className="space-y-3 p-4 pt-3">
                {gp.status === "finalizado" ? (
                  <Podium entries={podiums[gp.round]} />
                ) : (
                  <SessionsList sessions={gp.sessions} />
                )}
                <Link
                  to="/gp/$round"
                  params={{ round: String(gp.round) }}
                  className="inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Ver detalle →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Trazados de circuitos: bacinger/f1-circuits (licencia MIT). Datos de la temporada:
        Jolpica-F1.
      </p>
    </>
  );
}

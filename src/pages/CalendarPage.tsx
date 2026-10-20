import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { grandsPrix } from "@/data/mockData";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendario" subtitle={`${grandsPrix.length} Grandes Premios esta temporada.`} />
      <ul className="space-y-3">
        {grandsPrix.map((gp) => (
          <li
            key={gp.id}
            className={cn(
              "flex items-center gap-4 rounded-2xl border bg-card p-4",
              gp.status === "finalizado" && "opacity-70",
            )}
          >
            <div className="w-14 shrink-0 text-center">
              <div className="font-display text-3xl font-bold leading-none">{formatDate(gp.date, { day: "2-digit" })}</div>
              <div className="text-xs font-semibold uppercase text-primary">{formatDate(gp.date, { month: "short" })}</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Ronda {gp.round} · {gp.country}</p>
              <p className="truncate font-display text-xl font-bold uppercase">{gp.name}</p>
              <p className="truncate text-sm text-muted-foreground">{gp.circuit}</p>
            </div>
            <StatusBadge status={gp.status} />
          </li>
        ))}
      </ul>
    </>
  );
}

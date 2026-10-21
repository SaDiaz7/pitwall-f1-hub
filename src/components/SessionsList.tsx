import type { GrandPrixSession } from "@/lib/types";
import { cn } from "@/lib/utils";

// Muestra los horarios en la zona horaria del navegador de cada usuario.
const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function SessionsList({ sessions }: { sessions: GrandPrixSession[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Los horarios todavía no están confirmados.</p>;
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div>
      <ul className="space-y-1.5">
        {sessions.map((session) => (
          <li key={session.start} className="flex items-center justify-between gap-3 text-sm">
            <span className={cn("truncate", session.name === "Carrera" ? "font-bold" : "text-muted-foreground")}>
              {session.name}
            </span>
            <span className="shrink-0 tabular-nums">{timeFormatter.format(new Date(session.start))}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Horarios en tu zona horaria ({timeZone}).</p>
    </div>
  );
}
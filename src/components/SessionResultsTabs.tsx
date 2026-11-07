import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNow } from "@/hooks/useNow";
import { getSessionResults, type SessionResultRow, type SessionResults } from "@/lib/f1";
import type { GrandPrix } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOUR = 3_600_000;

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const STATUS_LABEL = { dnf: "Abandonó", dns: "No largó", dsq: "Descalificado" } as const;

function DriverCell({ row }: { row: SessionResultRow }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-5 w-1 shrink-0 rounded-sm"
        style={{ backgroundColor: row.teamColor ?? "#6B7280" }}
      />
      <span className="font-semibold">{row.code}</span>
      <span className="hidden truncate text-muted-foreground sm:inline">{row.name}</span>
      {row.status && (
        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
          {STATUS_LABEL[row.status]}
        </span>
      )}
    </span>
  );
}

function ResultsTable({ data }: { data: SessionResults }) {
  const { kind, rows } = data;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-2 py-2 text-left">Pos</th>
            <th className="px-2 py-2 text-left">Piloto</th>
            {kind === "qualifying" && (
              <>
                <th className="px-2 py-2 text-right">Q1</th>
                <th className="px-2 py-2 text-right">Q2</th>
                <th className="px-2 py-2 text-right">Q3</th>
              </>
            )}
            {kind === "practice" && (
              <>
                <th className="px-2 py-2 text-right">Mejor vuelta</th>
                <th className="px-2 py-2 text-right">Dif.</th>
              </>
            )}
            {kind === "race" && <th className="px-2 py-2 text-right">Tiempo / dif.</th>}
            {kind !== "qualifying" && <th className="hidden px-2 py-2 text-right sm:table-cell">Vueltas</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.code}-${index}`} className="border-t">
              <td className="px-2 py-2">
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 font-display text-sm font-bold",
                    row.position === 1 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
                  )}
                >
                  {row.position ?? "—"}
                </span>
              </td>
              <td className="px-2 py-2">
                <DriverCell row={row} />
              </td>
              {kind === "qualifying" &&
                [0, 1, 2].map((slot) => (
                  <td
                    key={slot}
                    className={cn(
                      "px-2 py-2 text-right tabular-nums",
                      row.q?.[slot] ? "" : "text-muted-foreground",
                      slot === 2 && row.position === 1 && "font-bold",
                    )}
                  >
                    {row.q?.[slot] ?? "—"}
                  </td>
                ))}
              {kind === "practice" && (
                <>
                  <td className="px-2 py-2 text-right tabular-nums">{row.best ?? "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{row.gap ?? "—"}</td>
                </>
              )}
              {kind === "race" && (
                <td className="px-2 py-2 text-right tabular-nums">{row.best ?? row.gap ?? "—"}</td>
              )}
              {kind !== "qualifying" && (
                <td className="hidden px-2 py-2 text-right tabular-nums text-muted-foreground sm:table-cell">
                  {row.laps ?? "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionPanel({
  iso,
  start,
  finished,
  now,
}: {
  iso: string;
  start: number;
  finished: boolean;
  now: number | null;
}) {
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [data, setData] = useState<SessionResults | null>(null);

  useEffect(() => {
    if (!finished) return;
    let cancelled = false;
    setState("loading");

    getSessionResults({ data: { start: iso } })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setState(result ? "ready" : "empty");
      })
      .catch((error) => {
        console.error("Resultados de la sesión:", error);
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [iso, finished]);

  if (!finished) {
    let text = "Cargando…";
    if (now !== null) {
      text =
        now >= start
          ? "La sesión está en curso o acaba de terminar. Los resultados aparecen en unos minutos."
          : `Todavía no empezó. Empieza el ${timeFormatter.format(start)}.`;
    }
    return <p className="text-sm text-muted-foreground">{text}</p>;
  }

  if (state === "loading") {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton h-9 w-full" />
        ))}
      </div>
    );
  }
  if (state === "error") {
    return <p className="text-sm text-muted-foreground">No pudimos cargar esta sesión en este momento.</p>;
  }
  if (state === "empty" || !data) {
    return (
      <p className="text-sm text-muted-foreground">
        Los resultados de esta sesión todavía no están disponibles. Probá de nuevo en un rato.
      </p>
    );
  }

  return <ResultsTable data={data} />;
}

export function SessionResultsTabs({ gp, embedded = false }: { gp: GrandPrix; embedded?: boolean }) {
  const now = useNow(60_000);
  const [selected, setSelected] = useState<string | null>(null);

  // La carrera ya tiene su propia tabla; acá van las demás sesiones del fin de semana.
  const items = gp.sessions
    .filter((session) => session.name !== "Carrera")
    .map((session) => {
      const start = Date.parse(session.start);
      return { name: session.name, iso: session.start, start, finished: now !== null && now >= start + HOUR };
    });

  if (!embedded && now !== null && items.every((item) => now < item.start)) return null;
  if (items.length === 0) return null;

  const lastFinished = [...items].reverse().find((item) => item.finished);
  const active = selected ?? lastFinished?.iso ?? items[0]?.iso ?? "";

  return (
    <section className={cn("space-y-4", !embedded && "rounded-2xl border bg-card p-5")}>
      {!embedded && (
        <div>
          <h2 className="text-xl font-bold uppercase">Resultados por sesión</h2>
          <p className="text-sm text-muted-foreground">
            Prácticas y clasificación del fin de semana. Se cargan a medida que termina cada sesión.
          </p>
        </div>
      )}

      <Tabs value={active} onValueChange={setSelected}>
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {items.map((item) => (
            <TabsTrigger key={item.iso} value={item.iso}>
              {item.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {items.map((item) => (
          <TabsContent key={item.iso} value={item.iso} className="mt-4">
            <SessionPanel iso={item.iso} start={item.start} finished={item.finished} now={now} />
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Datos: OpenF1. Pueden tardar un rato en aparecer después de que termina cada sesión.
      </p>
    </section>
  );
}
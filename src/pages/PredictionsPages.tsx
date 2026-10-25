import { useEffect, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PredictionEditor } from "@/components/PredictionEditor";
import { Button } from "@/components/ui/button";
import { usePredictions, type PredictionRow, type RaceEvent } from "@/hooks/usePredictions";
import { MAX_POINTS, POSITION_POINTS, breakdown } from "@/lib/predictions";
import type { Driver, GrandPrix } from "@/lib/types";
import { cn } from "@/lib/utils";

const route = getRouteApi("/_privado/predicciones");

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

type Message = { type: "ok" | "error"; text: string } | null;

function RaceCard({
  gp,
  event,
  prediction,
  drivers,
  nameOf,
  now,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: {
  gp: GrandPrix;
  event: RaceEvent | undefined;
  prediction: PredictionRow | undefined;
  drivers: Driver[];
  nameOf: (id: string | null) => string;
  now: number;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (picks: string[]) => void;
}) {
  const deadline = event?.qualifying_at ? new Date(event.qualifying_at).getTime() : null;
  const scored = event?.scored_at != null;
  const open = event !== undefined && !scored && deadline !== null && now < deadline;

  return (
    <article className="space-y-3 rounded-2xl border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Ronda {gp.round}</p>
          <h2 className="font-display text-xl font-bold uppercase">{gp.name}</h2>
        </div>
        {prediction?.points != null && (
          <span className="rounded-md bg-gradient-primary px-2.5 py-1 text-sm font-bold text-primary-foreground">
            {prediction.points} pts
          </span>
        )}
      </header>

      {!event && (
        <p className="text-sm text-muted-foreground">Las predicciones de esta carrera todavía no están habilitadas.</p>
      )}

      {open && deadline !== null && (
        <p className="text-xs text-muted-foreground">
          Cierran cuando empieza la clasificación: {dateFormatter.format(new Date(deadline))}.
        </p>
      )}

      {open && editing ? (
        <PredictionEditor
          drivers={drivers}
          initial={prediction?.picks ?? []}
          saving={saving}
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : (
        <>
          {prediction && !scored && (
            <ol className="space-y-1 text-sm">
              {prediction.picks.map((id, index) => (
                <li key={`${id}-${index}`} className="flex gap-2">
                  <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{index + 1}.º</span>
                  <span className="font-semibold">{nameOf(id)}</span>
                </li>
              ))}
            </ol>
          )}

          {open && (
            <Button type="button" onClick={onEdit} className="bg-gradient-primary font-semibold">
              {prediction ? "Editar predicción" : "Hacer mi predicción"}
            </Button>
          )}

          {event && !open && !scored && (
            <p className="text-sm text-muted-foreground">
              {prediction
                ? "Las predicciones cerraron. Cuando termine la carrera se calculan los puntos."
                : "Las predicciones cerraron y no hiciste la tuya."}
            </p>
          )}

          {scored && !prediction && (
            <p className="text-sm text-muted-foreground">No hiciste una predicción para esta carrera.</p>
          )}

          {scored && prediction && event && (
            <ol className="space-y-1.5 text-sm">
              {breakdown(prediction.picks, event.results ?? []).map((row) => (
                <li key={row.position} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{row.position}.º</span>
                  {row.hit ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Acertaste" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="No acertaste" />
                  )}
                  <span className={cn("min-w-0 flex-1 truncate", row.hit ? "font-semibold" : "text-muted-foreground")}>
                    {nameOf(row.pick)}
                    {!row.hit && <span className="text-xs"> · fue {nameOf(row.result)}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{row.points > 0 ? `+${row.points}` : "0"}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </article>
  );
}

export function PredictionsPage() {
  const { grandsPrix, drivers } = route.useLoaderData();
  const season = new Date().getFullYear();
  const { events, predictions, loading, error, savePrediction } = usePredictions(season);

  const [now, setNow] = useState(() => Date.now());
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  // Actualiza el reloj para que los cierres se reflejen sin recargar.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const names = useMemo(() => new Map(drivers.map((d) => [d.id, d.name])), [drivers]);
  const nameOf = (id: string | null) => (id ? (names.get(id) ?? id) : "—");

  const upcoming = grandsPrix.filter((gp) => gp.status === "proximo");
  const past = grandsPrix
    .filter((gp) => gp.status === "finalizado" && (predictions[gp.round] || events[gp.round]?.scored_at))
    .reverse();

  const totalPoints = Object.values(predictions).reduce((sum, row) => sum + (row.points ?? 0), 0);
  const scoredCount = Object.values(predictions).filter((row) => row.points !== null).length;

  const onSave = async (round: number, picks: string[]) => {
    setMessage(null);
    setSaving(true);
    const result = await savePrediction(round, picks);
    setSaving(false);

    if (result.ok) {
      setEditingRound(null);
      setMessage({ type: "ok", text: "Predicción guardada." });
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  const card = (gp: GrandPrix) => (
    <RaceCard
      key={gp.id}
      gp={gp}
      event={events[gp.round]}
      prediction={predictions[gp.round]}
      drivers={drivers}
      nameOf={nameOf}
      now={now}
      editing={editingRound === gp.round}
      saving={saving}
      onEdit={() => {
        setMessage(null);
        setEditingRound(gp.round);
      }}
      onCancel={() => setEditingRound(null)}
      onSave={(picks) => onSave(gp.round, picks)}
    />
  );

  return (
    <>
      <PageHeader title="Predicciones" subtitle="Predecí el top 10 de cada carrera y sumá puntos." />

      <div className="mb-6 space-y-2 rounded-2xl border bg-card p-5">
        <p className="text-sm">
          <span className="font-display text-2xl font-bold">{totalPoints} pts</span>{" "}
          <span className="text-muted-foreground">
            en {scoredCount} {scoredCount === 1 ? "carrera puntuada" : "carreras puntuadas"}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Sumás puntos por cada piloto que acertás en su puesto exacto: {POSITION_POINTS[0]} por el ganador,{" "}
          {POSITION_POINTS[1]} por el 2.º y el 3.º, y {POSITION_POINTS[3]} por cada uno del 4.º al 10.º. Máximo por
          carrera: {MAX_POINTS} puntos.
        </p>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}
      {message && (
        <p
          className={cn(
            "mb-4 rounded-md p-2 text-sm",
            message.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {message.text}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando tus predicciones…</p>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase">Próximas carreras</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quedan carreras por disputar en esta temporada.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">{upcoming.map(card)}</div>
            )}
          </section>

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold uppercase">Anteriores</h2>
              <div className="grid gap-4 lg:grid-cols-2">{past.map(card)}</div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
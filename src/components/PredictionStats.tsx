import { Link } from "@tanstack/react-router";
import type { PredictionRow, RaceEvent } from "@/hooks/usePredictions";

interface PredictionStatsProps {
  events: Record<number, RaceEvent>;
  predictions: Record<number, PredictionRow>;
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string | undefined }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function PredictionStats({ events, predictions }: PredictionStatsProps) {
  const rows = Object.values(predictions);
  const scored = rows.filter((row) => row.points !== null);
  const totalPoints = scored.reduce((sum, row) => sum + (row.points ?? 0), 0);
  const average = scored.length > 0 ? totalPoints / scored.length : 0;
  const best = scored.reduce<PredictionRow | null>(
    (top, row) => (top === null || (row.points ?? 0) > (top.points ?? 0) ? row : top),
    null,
  );

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Tus predicciones</h2>
        <Link to="/predicciones" className="text-sm font-semibold text-primary hover:underline">
          Ver todas
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hiciste ninguna predicción. Entrá a{" "}
          <Link to="/predicciones" className="font-semibold text-primary hover:underline">
            Predicciones
          </Link>{" "}
          y armá tu top 10 de la próxima carrera.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Puntos totales" value={String(totalPoints)} />
          <Stat label="Carreras puntuadas" value={String(scored.length)} />
          <Stat
            label="Promedio por carrera"
            value={average.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
          />
          <Stat
            label="Mejor carrera"
            value={best ? `${best.points} pts` : "—"}
            detail={best ? events[best.round]?.name : undefined}
          />
        </div>
      )}
    </section>
  );
}
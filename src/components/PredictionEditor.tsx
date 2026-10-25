import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PICK_COUNT, POSITION_POINTS } from "@/lib/predictions";
import type { Driver } from "@/lib/types";

const SELECT_CLASS = "h-10 w-full rounded-md border bg-card px-3 text-sm";

export function PredictionEditor({
  drivers,
  initial,
  saving,
  onSave,
  onCancel,
}: {
  drivers: Driver[];
  initial: string[];
  saving: boolean;
  onSave: (picks: string[]) => void;
  onCancel: () => void;
}) {
  const [picks, setPicks] = useState<string[]>(() => Array.from({ length: PICK_COUNT }, (_, i) => initial[i] ?? ""));

  const complete = picks.every((pick) => pick !== "");

  const setPick = (position: number, driverId: string) =>
    setPicks((current) => current.map((pick, i) => (i === position ? driverId : pick)));

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {picks.map((pick, position) => {
          const points = POSITION_POINTS[position] ?? 0;
          return (
            <li key={position} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-semibold">
                {position + 1}.º{" "}
                <span className="font-normal text-muted-foreground">
                  ({points} {points === 1 ? "pt" : "pts"})
                </span>
              </span>
              <select
                value={pick}
                aria-label={`Puesto ${position + 1}`}
                onChange={(e) => setPick(position, e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Elegir piloto…</option>
                {drivers
                  .filter((driver) => driver.id === pick || !picks.includes(driver.id))
                  .map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
              </select>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={!complete || saving}
          onClick={() => onSave(picks)}
          className="bg-gradient-primary font-semibold"
        >
          {saving ? "Guardando…" : "Guardar predicción"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
      {!complete && <p className="text-xs text-muted-foreground">Completá los 10 puestos para poder guardar.</p>}
    </div>
  );
}
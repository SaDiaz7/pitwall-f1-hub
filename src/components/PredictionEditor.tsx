import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BONUS_QUESTIONS,
  DNF_OPTIONS,
  PICK_COUNT,
  POSITION_POINTS,
  YES_NO_OPTIONS,
  type BonusAnswers,
  type BonusKey,
} from "@/lib/predictions";
import type { Driver } from "@/lib/types";
import { cn } from "@/lib/utils";

const SELECT_CLASS = "h-10 w-full rounded-md border bg-card px-3 text-sm";

// Botones de opción. Tocar la opción elegida la deselecciona (las extras son opcionales).
function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? undefined : option.value)}
            className={cn(
              "h-9 rounded-md border px-4 text-sm font-semibold transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent/40",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function PredictionEditor({
  drivers,
  initial,
  initialBonus,
  saving,
  onSave,
  onCancel,
}: {
  drivers: Driver[];
  initial: string[];
  initialBonus: BonusAnswers;
  saving: boolean;
  onSave: (picks: string[], bonus: BonusAnswers) => void;
  onCancel: () => void;
}) {
  const [picks, setPicks] = useState<string[]>(() => Array.from({ length: PICK_COUNT }, (_, i) => initial[i] ?? ""));
  const [bonus, setBonus] = useState<BonusAnswers>(initialBonus);

  const complete = picks.every((pick) => pick !== "");

  const setPick = (position: number, driverId: string) =>
    setPicks((current) => current.map((pick, i) => (i === position ? driverId : pick)));

  const setAnswer = (key: BonusKey, value: string | undefined) =>
    setBonus((current) => {
      const next = { ...current };
      if (value === undefined) delete next[key];
      else next[key] = value;
      return next;
    });

  return (
    <div className="space-y-5">
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

      <div className="space-y-3 border-t pt-4">
        <div>
          <h3 className="font-display text-lg font-bold uppercase">Predicciones extra</h3>
          <p className="text-xs text-muted-foreground">Opcionales: cada acierto suma puntos aparte del top 10.</p>
        </div>

        {BONUS_QUESTIONS.map((question) => (
          <div key={question.key} className="space-y-1.5">
            <p className="text-sm font-semibold">
              {question.label}{" "}
              <span className="font-normal text-muted-foreground">
                ({question.points} {question.points === 1 ? "pt" : "pts"})
              </span>
            </p>

            {question.kind === "yesno" && (
              <Choice
                label={question.label}
                options={YES_NO_OPTIONS}
                value={bonus[question.key]}
                onChange={(value) => setAnswer(question.key, value)}
              />
            )}

            {question.kind === "dnf" && (
              <Choice
                label={question.label}
                options={DNF_OPTIONS}
                value={bonus[question.key]}
                onChange={(value) => setAnswer(question.key, value)}
              />
            )}

            {question.kind === "driver" && (
              <select
                value={bonus[question.key] ?? ""}
                aria-label={question.label}
                onChange={(e) => setAnswer(question.key, e.target.value === "" ? undefined : e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Elegir piloto…</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={!complete || saving}
          onClick={() => onSave(picks, bonus)}
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
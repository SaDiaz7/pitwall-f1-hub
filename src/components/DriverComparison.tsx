import { useState } from "react";
import { getTeamColor } from "@/lib/team-colors";
import type { Driver } from "@/lib/types";
import { cn } from "@/lib/utils";

const SELECT_CLASS = "h-10 w-full rounded-md border bg-card px-3 text-sm";

interface Entry {
  driver: Driver;
  position: number;
}

function Metric({
  label,
  a,
  b,
  colorA,
  colorB,
  prefix = "",
  lowerIsBetter = false,
  showBars = true,
}: {
  label: string;
  a: number;
  b: number;
  colorA: string;
  colorB: string;
  prefix?: string;
  lowerIsBetter?: boolean;
  showBars?: boolean;
}) {
  const aWins = lowerIsBetter ? a < b : a > b;
  const bWins = lowerIsBetter ? b < a : b > a;
  const max = Math.max(a, b, 1);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-3">
        <span className={cn("text-right font-display text-2xl font-bold tabular-nums", aWins && "text-primary")}>
          {prefix}
          {a}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("text-left font-display text-2xl font-bold tabular-nums", bWins && "text-primary")}>
          {prefix}
          {b}
        </span>
      </div>

      {showBars && (
        <div className="grid grid-cols-2 gap-1">
          <div className="flex justify-end">
            <div
              className={cn("h-2 rounded-full", bWins && "opacity-40")}
              style={{ width: `${(a / max) * 100}%`, backgroundColor: colorA }}
            />
          </div>
          <div className="flex justify-start">
            <div
              className={cn("h-2 rounded-full", aWins && "opacity-40")}
              style={{ width: `${(b / max) * 100}%`, backgroundColor: colorB }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DriverHeader({ entry, align }: { entry: Entry; align: "left" | "right" }) {
  return (
    <div
      className={cn("min-w-0 border-b-4 pb-2", align === "right" ? "text-right" : "text-left")}
      style={{ borderBottomColor: getTeamColor(entry.driver.teamId, entry.driver.teamName) }}
    >
      {entry.driver.number > 0 && (
        <p className="font-display text-3xl font-bold leading-none text-primary">{entry.driver.number}</p>
      )}
      <p className="truncate font-semibold">{entry.driver.name}</p>
      <p className="truncate text-xs text-muted-foreground">{entry.driver.teamName}</p>
    </div>
  );
}

export function DriverComparison({ drivers }: { drivers: Driver[] }) {
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");

  if (drivers.length < 2) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        No hay suficientes pilotos para comparar en esta temporada.
      </div>
    );
  }

  // La posición es el lugar en la tabla del campeonato.
  const entries: Entry[] = drivers.map((driver, index) => ({ driver, position: index + 1 }));
  const first = entries[0]!;
  const second = entries[1]!;

  // Si el piloto elegido no existe en esta temporada, usa los dos primeros.
  const a = entries.find((e) => e.driver.id === aId) ?? first;
  const b = entries.find((e) => e.driver.id === bId) ?? second;
  const same = a.driver.id === b.driver.id;

  const colorA = getTeamColor(a.driver.teamId, a.driver.teamName);
  const colorB = getTeamColor(b.driver.teamId, b.driver.teamName);

  const diff = a.driver.points - b.driver.points;
  const summary =
    diff === 0
      ? "Están igualados en puntos."
      : `${diff > 0 ? a.driver.name : b.driver.name} le saca ${Math.abs(diff)} pts a ${
          diff > 0 ? b.driver.name : a.driver.name
        }.`;

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          <span>Piloto 1</span>
          <select value={a.driver.id} onChange={(e) => setAId(e.target.value)} className={SELECT_CLASS}>
            {entries.map((e) => (
              <option key={e.driver.id} value={e.driver.id}>
                {e.driver.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>Piloto 2</span>
          <select value={b.driver.id} onChange={(e) => setBId(e.target.value)} className={SELECT_CLASS}>
            {entries.map((e) => (
              <option key={e.driver.id} value={e.driver.id}>
                {e.driver.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {same ? (
        <p className="text-sm text-muted-foreground">Elegí dos pilotos distintos para compararlos.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <DriverHeader entry={a} align="left" />
            <DriverHeader entry={b} align="right" />
          </div>

          <div className="space-y-5">
            <Metric
              label="Posición"
              a={a.position}
              b={b.position}
              colorA={colorA}
              colorB={colorB}
              prefix="P"
              lowerIsBetter
              showBars={false}
            />
            <Metric label="Puntos" a={a.driver.points} b={b.driver.points} colorA={colorA} colorB={colorB} />
            <Metric label="Victorias" a={a.driver.wins} b={b.driver.wins} colorA={colorA} colorB={colorB} />
          </div>

          <p className="border-t pt-4 text-sm text-muted-foreground">{summary}</p>
        </>
      )}
    </div>
  );
}
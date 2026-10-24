import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getContenders, getRemaining } from "@/lib/championship";
import {
  MAX_POSITION,
  bestAllowedForB,
  buildEvents,
  computeDuel,
  verdictOf,
  winsToClinch,
  type BLimit,
  type Picks,
} from "@/lib/scenarios";
import type { Driver, GrandPrix } from "@/lib/types";
import { cn } from "@/lib/utils";

const SELECT_CLASS = "h-10 w-full rounded-md border bg-card px-3 text-sm";
const POSITIONS = Array.from({ length: MAX_POSITION }, (_, i) => i + 1);

function Notice({ children }: { children: string }) {
  return <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">{children}</div>;
}

function PositionSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block min-w-0 space-y-1 text-xs font-medium">
      <span className="block truncate text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={SELECT_CLASS}>
        <option value={0}>Sin puntos</option>
        {POSITIONS.map((position) => (
          <option key={position} value={position}>
            {position}.º
          </option>
        ))}
      </select>
    </label>
  );
}

function limitText(limit: BLimit, a: Driver, b: Driver): string {
  if (limit.status === "always") {
    return `Con los resultados que cargaste para ${a.name}, queda por delante de ${b.name} pase lo que pase con él en esas carreras.`;
  }
  if (limit.status === "never") {
    return `Con los resultados que cargaste para ${a.name}, no alcanza a ${b.name} aunque ${b.name} no sume más puntos.`;
  }
  if (limit.position > MAX_POSITION) {
    return `Para que ${a.name} quede por delante, ${b.name} no puede sumar ningún punto en lo que queda.`;
  }
  return `Para que ${a.name} quede por delante, ${b.name} tiene que terminar ${limit.position}.º o peor en todas las carreras y sprints (si ese puesto coincide con el de ${a.name}, se toma el siguiente).`;
}

export function ScenarioBuilder({ drivers, schedule }: { drivers: Driver[]; schedule: GrandPrix[] }) {
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [picks, setPicks] = useState<Picks>({});

  const first = drivers[0];
  const second = drivers[1];

  if (!first || !second || schedule.length === 0) {
    return <Notice>No pudimos cargar los datos necesarios (pilotos y calendario) para armar escenarios.</Notice>;
  }

  const events = buildEvents(schedule);
  if (events.length === 0) {
    return <Notice>No quedan carreras por disputar en esta temporada.</Notice>;
  }

  const remaining = getRemaining(schedule);

  // Por defecto: el 2.º del campeonato (A) contra el líder (B).
  const a = drivers.find((d) => d.id === aId) ?? second;
  const b = drivers.find((d) => d.id === bId) ?? first;
  const same = a.id === b.id;

  const setPick = (eventId: string, who: "a" | "b", position: number) =>
    setPicks((current) => {
      const previous = current[eventId] ?? { a: 0, b: 0 };
      return { ...current, [eventId]: { ...previous, [who]: position } };
    });

  const fillAll = (aPosition: number, bPosition: number) =>
    setPicks(Object.fromEntries(events.map((event) => [event.id, { a: aPosition, b: bPosition }])));

  const totals = computeDuel(a, b, events, picks);
  const verdict = verdictOf(totals);
  const hasPicksForA = events.some((event) => (picks[event.id]?.a ?? 0) > 0);
  const limit = hasPicksForA ? bestAllowedForB(a, b, events, picks) : null;

  // Quién va adelante hoy, para calcular cuántas victorias le alcanzan.
  const leader = drivers.indexOf(a) <= drivers.indexOf(b) ? a : b;
  const chaser = leader.id === a.id ? b : a;
  const gap = Math.max(0, leader.points - chaser.points);
  const clinch = same ? null : winsToClinch(gap, remaining.races, remaining.sprints);

  // Otros pilotos con chances: este análisis solo mira el duelo.
  const { alive } = getContenders(drivers, remaining);
  const others = alive.filter((c) => c.driver.id !== a.id && c.driver.id !== b.id).length;

  const verdictText =
    verdict === "a"
      ? `En este escenario, ${a.name} termina por delante de ${b.name}.`
      : verdict === "b"
        ? `En este escenario, ${b.name} termina por delante de ${a.name}.`
        : "Empatan en puntos y en victorias: se define por la cantidad de segundos puestos y siguientes.";

  const clinchText =
    clinch === null
      ? `Aun ganando las ${remaining.races} carreras que quedan, ${leader.name} no puede asegurarlo solo con victorias (los sprints también cuentan).`
      : clinch === 0
        ? `${chaser.name} ya no puede alcanzar a ${leader.name}.`
        : `Si ${leader.name} gana ${clinch} ${clinch === 1 ? "carrera más" : "carreras más"} (de las ${remaining.races} que quedan), ${chaser.name} ya no puede alcanzarlo, pase lo que pase en el resto.`;

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Elegí dos pilotos y completá cómo terminan cada carrera y sprint que falta. “Sin puntos” significa 11.º o
          peor, o abandono.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            <span>Piloto A</span>
            <select value={a.id} onChange={(e) => setAId(e.target.value)} className={SELECT_CLASS}>
              {drivers.map((d, index) => (
                <option key={d.id} value={d.id}>
                  P{index + 1} · {d.name} · {d.points} pts
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Piloto B</span>
            <select value={b.id} onChange={(e) => setBId(e.target.value)} className={SELECT_CLASS}>
              {drivers.map((d, index) => (
                <option key={d.id} value={d.id}>
                  P{index + 1} · {d.name} · {d.points} pts
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {same ? (
        <Notice>Elegí dos pilotos distintos para armar un escenario.</Notice>
      ) : (
        <>
          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <h3 className="text-lg font-bold uppercase">Si pasa esto…</h3>
            <p className="text-sm">{clinchText}</p>
            <p className="text-xs text-muted-foreground">
              Cálculo del peor caso para {leader.name}: en las carreras que no gane, {chaser.name} gana y él no suma,
              y en los sprints {chaser.name} los gana todos. Aun así, con esas victorias el título queda asegurado.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold uppercase">Armá el escenario</h3>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fillAll(1, 2)}>
                  {a.name} gana todo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fillAll(2, 1)}>
                  {b.name} gana todo
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPicks({})}>
                  Limpiar
                </Button>
              </div>
            </div>

            <ul className="space-y-2">
              {events.map((event) => {
                const pick = picks[event.id] ?? { a: 0, b: 0 };
                const conflict = pick.a !== 0 && pick.a === pick.b;

                return (
                  <li
                    key={event.id}
                    className={cn("rounded-xl border bg-card p-3", conflict && "border-destructive")}
                  >
                    <p className="mb-2 text-sm font-semibold">{event.label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <PositionSelect label={a.name} value={pick.a} onChange={(v) => setPick(event.id, "a", v)} />
                      <PositionSelect label={b.name} value={pick.b} onChange={(v) => setPick(event.id, "b", v)} />
                    </div>
                    {conflict && (
                      <p className="mt-2 text-xs text-destructive">No pueden terminar en el mismo puesto.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <h3 className="text-lg font-bold uppercase">Resultado del escenario</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="truncate text-sm text-muted-foreground">{a.name}</p>
                <p className="font-display text-3xl font-bold tabular-nums">{totals.aTotal} pts</p>
                <p className="text-xs text-muted-foreground">{totals.aWins} victorias</p>
              </div>
              <div className="text-right">
                <p className="truncate text-sm text-muted-foreground">{b.name}</p>
                <p className="font-display text-3xl font-bold tabular-nums">{totals.bTotal} pts</p>
                <p className="text-xs text-muted-foreground">{totals.bWins} victorias</p>
              </div>
            </div>

            <p className="text-sm font-semibold">{verdictText}</p>

            {totals.conflicts.length > 0 && (
              <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">
                Hay {totals.conflicts.length} {totals.conflicts.length === 1 ? "evento" : "eventos"} donde los dos
                terminan en el mismo puesto: no se cuentan hasta que lo corrijas.
              </p>
            )}

            {limit && (
              <div className="space-y-1 border-t pt-4">
                <p className="text-sm font-semibold">¿Qué tiene que hacer {b.name}?</p>
                <p className="text-sm">{limitText(limit, a, b)}</p>
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            {others > 0 && (
              <p>
                Ojo: {others} {others === 1 ? "piloto más sigue" : "pilotos más siguen"} con chances de título.
                Esta pantalla analiza solo el duelo entre {a.name} y {b.name}.
              </p>
            )}
            <p>
              Puntos usados: carrera 25-18-15-12-10-8-6-4-2-1 y sprint 8-7-6-5-4-3-2-1. Si empatan en puntos,
              desempata por victorias de carrera (las de sprint no cuentan).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
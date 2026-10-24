import type { Driver, GrandPrix } from "@/lib/types";

// Puntos por puesto. Revisalos contra el reglamento vigente de la temporada.
export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] as const;
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

// Se pueden elegir los puestos 1 al 10. 0 significa "sin puntos" (11.º o peor, o abandono).
export const MAX_POSITION = 10;

export type EventKind = "race" | "sprint";

export interface ScenarioEvent {
  id: string;
  kind: EventKind;
  label: string;
}

export interface Pick {
  a: number;
  b: number;
}

export type Picks = Record<string, Pick>;

export function pointsFor(kind: EventKind, position: number): number {
  if (position < 1) return 0;
  const table: readonly number[] = kind === "race" ? RACE_POINTS : SPRINT_POINTS;
  return table[position - 1] ?? 0;
}

// Carreras y sprints que faltan, en orden del calendario (el sprint va antes que la carrera).
export function buildEvents(schedule: GrandPrix[]): ScenarioEvent[] {
  const events: ScenarioEvent[] = [];

  for (const gp of schedule) {
    if (gp.status !== "proximo") continue;

    if (gp.sessions.some((s) => s.name === "Sprint")) {
      events.push({ id: `${gp.round}-sprint`, kind: "sprint", label: `${gp.name} · Sprint` });
    }
    events.push({ id: `${gp.round}-race`, kind: "race", label: `${gp.name} · Carrera` });
  }

  return events;
}

export interface DuelTotals {
  aTotal: number;
  bTotal: number;
  aWins: number;
  bWins: number;
  conflicts: string[]; // eventos donde los dos terminan en el mismo puesto (no se cuentan)
}

// Suma lo cargado en el escenario a los puntos y victorias actuales.
export function computeDuel(a: Driver, b: Driver, events: ScenarioEvent[], picks: Picks): DuelTotals {
  let aTotal = a.points;
  let bTotal = b.points;
  let aWins = a.wins;
  let bWins = b.wins;
  const conflicts: string[] = [];

  for (const event of events) {
    const pick = picks[event.id] ?? { a: 0, b: 0 };

    if (pick.a !== 0 && pick.a === pick.b) {
      conflicts.push(event.id);
      continue;
    }

    aTotal += pointsFor(event.kind, pick.a);
    bTotal += pointsFor(event.kind, pick.b);

    // Las victorias de sprint no cuentan para el desempate.
    if (event.kind === "race") {
      if (pick.a === 1) aWins += 1;
      if (pick.b === 1) bWins += 1;
    }
  }

  return { aTotal, bTotal, aWins, bWins, conflicts };
}

export type Verdict = "a" | "b" | "tie";

// Más puntos; si empatan, más victorias; si vuelven a empatar, queda empate.
export function verdictOf(totals: DuelTotals): Verdict {
  if (totals.aTotal !== totals.bTotal) return totals.aTotal > totals.bTotal ? "a" : "b";
  if (totals.aWins !== totals.bWins) return totals.aWins > totals.bWins ? "a" : "b";
  return "tie";
}

export type BLimit = { status: "always" } | { status: "never" } | { status: "limit"; position: number };

// Con los resultados cargados para A, ¿cuál es el mejor puesto que puede ocupar B
// (en todas las carreras y sprints) sin que A pierda el título por puntos?
// Si B y A coinciden en un puesto, B toma el siguiente. position = MAX_POSITION + 1 significa "sin puntos".
export function bestAllowedForB(a: Driver, b: Driver, events: ScenarioEvent[], picks: Picks): BLimit {
  for (let policy = 1; policy <= MAX_POSITION + 1; policy++) {
    let aTotal = a.points;
    let bTotal = b.points;

    for (const event of events) {
      const aPosition = picks[event.id]?.a ?? 0;
      aTotal += pointsFor(event.kind, aPosition);

      let bPosition = policy > MAX_POSITION ? 0 : policy;
      if (bPosition !== 0 && bPosition === aPosition) {
        bPosition = bPosition + 1 > MAX_POSITION ? 0 : bPosition + 1;
      }
      bTotal += pointsFor(event.kind, bPosition);
    }

    if (aTotal > bTotal) {
      return policy === 1 ? { status: "always" } : { status: "limit", position: policy };
    }
  }

  return { status: "never" };
}

// Victorias que tiene que sumar el líder para que su rival ya no lo pueda alcanzar,
// en el peor caso: en las carreras que el líder no gana, el rival gana y el líder no suma;
// en los sprints, el rival los gana todos y el líder ninguno; y en las que gana el líder,
// el rival termina 2.º. Devuelve null si ni ganando todas las carreras alcanza.
export function winsToClinch(gap: number, races: number, sprints: number): number | null {
  const raceWin = RACE_POINTS[0];
  const raceSecond = RACE_POINTS[1];
  const sprintWin = SPRINT_POINTS[0];

  for (let m = 0; m <= races; m++) {
    const leaderMin = raceWin * m;
    const chaserMax = raceSecond * m + raceWin * (races - m) + sprintWin * sprints;
    if (gap + leaderMin > chaserMax) return m;
  }

  return null;
}
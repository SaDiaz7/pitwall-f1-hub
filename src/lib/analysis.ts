import { getTeamColor } from "@/lib/team-colors";

export interface ResultRow {
  round: number;
  race_name: string | null;
  driver_id: string;
  driver_code: string | null;
  driver_name: string;
  constructor_id: string;
  constructor_name: string;
  grid: number;
  final_position: number;
  position_text: string;
  points: number;
  sprint_points: number;
  status: string;
  fastest_lap_rank: number | null;
}

export interface RoundInfo {
  round: number;
  name: string;
}

export interface Series {
  id: string;
  label: string;
  color: string;
  dashed: boolean;
  total: number;
  // Un valor por carrera; null antes de que el piloto o equipo aparezca.
  values: (number | null)[];
}

export interface Comeback {
  id: string;
  label: string;
  color: string;
  value: number;
}

export interface Tally {
  id: string;
  label: string;
  name: string;
  color: string;
  wins: number;
  podiums: number;
  fastest: number;
}

export interface Analysis {
  rounds: RoundInfo[];
  driverPoints: Series[];
  constructorPoints: Series[];
  driverPositions: Series[];
  constructorPositions: Series[];
  comebacks: Comeback[];
  tally: Tally[];
}

interface Entity {
  id: string;
  label: string;
  teamId: string;
  teamName: string;
  rows: ResultRow[];
}

interface Snapshot {
  started: boolean;
  points: number;
  wins: number;
  p2: number;
  p3: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;
const isClassified = (row: ResultRow) => /^\d+$/.test(row.position_text);
const pointsOf = (row: ResultRow) => row.points + row.sprint_points;

function shortName(row: ResultRow): string {
  if (row.driver_code) return row.driver_code;
  const last = row.driver_name.split(" ").pop() ?? row.driver_name;
  return last.slice(0, 3).toUpperCase();
}

function toEntities(rows: ResultRow[], mode: "driver" | "constructor"): Entity[] {
  const groups = new Map<string, ResultRow[]>();
  for (const row of rows) {
    const key = mode === "driver" ? row.driver_id : row.constructor_id;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  const entities: Entity[] = [];
  for (const [id, list] of groups) {
    const sorted = [...list].sort((a, b) => a.round - b.round);
    const last = sorted[sorted.length - 1];
    if (!last) continue;

    entities.push({
      id,
      label: mode === "driver" ? shortName(last) : last.constructor_name,
      teamId: last.constructor_id,
      teamName: last.constructor_name,
      rows: sorted,
    });
  }
  return entities;
}

function computeSeries(
  entities: Entity[],
  roundNumbers: number[],
  dashSecond: boolean,
): { points: Series[]; positions: Series[] } {
  // Puntos y mejores resultados acumulados, carrera a carrera.
  const stats = entities.map((entity) => {
    let started = false;
    let points = 0;
    let wins = 0;
    let p2 = 0;
    let p3 = 0;

    const timeline: Snapshot[] = roundNumbers.map((round) => {
      for (const row of entity.rows) {
        if (row.round !== round) continue;
        started = true;
        points += pointsOf(row);
        if (isClassified(row)) {
          if (row.final_position === 1) wins += 1;
          else if (row.final_position === 2) p2 += 1;
          else if (row.final_position === 3) p3 += 1;
        }
      }
      return { started, points, wins, p2, p3 };
    });

    return { entity, timeline };
  });

  // Posición en el campeonato después de cada carrera.
  const positionsById = new Map<string, (number | null)[]>();
  for (const { entity } of stats) positionsById.set(entity.id, roundNumbers.map(() => null));

  roundNumbers.forEach((_, index) => {
    const active = stats.filter((s) => s.timeline[index]?.started);
    active.sort((a, b) => {
      const x = a.timeline[index];
      const y = b.timeline[index];
      if (!x || !y) return 0;
      return (
        y.points - x.points ||
        y.wins - x.wins ||
        y.p2 - x.p2 ||
        y.p3 - x.p3 ||
        a.entity.label.localeCompare(b.entity.label)
      );
    });
    active.forEach((s, position) => {
      const list = positionsById.get(s.entity.id);
      if (list) list[index] = position + 1;
    });
  });

  // El segundo piloto de cada equipo va en línea punteada.
  const dashed = new Set<string>();
  if (dashSecond) {
    const byTeam = new Map<string, typeof stats>();
    for (const s of stats) {
      const list = byTeam.get(s.entity.teamId);
      if (list) list.push(s);
      else byTeam.set(s.entity.teamId, [s]);
    }
    for (const list of byTeam.values()) {
      const ordered = [...list].sort(
        (a, b) => (b.timeline[b.timeline.length - 1]?.points ?? 0) - (a.timeline[a.timeline.length - 1]?.points ?? 0),
      );
      ordered.slice(1).forEach((s) => dashed.add(s.entity.id));
    }
  }

  const base = stats.map((s) => ({
    id: s.entity.id,
    label: s.entity.label,
    color: getTeamColor(s.entity.teamId, s.entity.teamName),
    dashed: dashed.has(s.entity.id),
    total: round1(s.timeline[s.timeline.length - 1]?.points ?? 0),
  }));

  const points: Series[] = stats
    .map((s, i) => ({
      ...(base[i] as (typeof base)[number]),
      values: s.timeline.map((t) => (t.started ? round1(t.points) : null)),
    }))
    .sort((a, b) => b.total - a.total);

  const positions: Series[] = stats
    .map((s, i) => ({
      ...(base[i] as (typeof base)[number]),
      values: positionsById.get(s.entity.id) ?? roundNumbers.map(() => null),
    }))
    .sort((a, b) => b.total - a.total);

  return { points, positions };
}

export function buildAnalysis(rows: ResultRow[]): Analysis {
  const roundNumbers = [...new Set(rows.map((r) => r.round))].sort((a, b) => a - b);
  const rounds: RoundInfo[] = roundNumbers.map((round) => ({
    round,
    name: rows.find((r) => r.round === round)?.race_name ?? `Ronda ${round}`,
  }));

  const driverEntities = toEntities(rows, "driver");
  const constructorEntities = toEntities(rows, "constructor");

  const drivers = computeSeries(driverEntities, roundNumbers, true);
  const constructors = computeSeries(constructorEntities, roundNumbers, false);

  // Mejores remontadas: posiciones ganadas entre la largada y la meta (solo quienes terminaron).
  // Si largó desde boxes, se cuenta desde el último puesto de la grilla.
  const startersByRound = new Map<number, number>();
  for (const row of rows) startersByRound.set(row.round, (startersByRound.get(row.round) ?? 0) + 1);

  const driverInfo = new Map(driverEntities.map((e) => [e.id, e]));
  const gains = new Map<string, number>();
  for (const row of rows) {
    if (!isClassified(row)) continue;
    const startedFrom = row.grid > 0 ? row.grid : (startersByRound.get(row.round) ?? row.final_position);
    const gain = Math.max(0, startedFrom - row.final_position);
    gains.set(row.driver_id, (gains.get(row.driver_id) ?? 0) + gain);
  }

  const comebacks: Comeback[] = [...gains.entries()]
    .map(([id, value]) => {
      const info = driverInfo.get(id);
      return {
        id,
        label: info?.label ?? id,
        color: info ? getTeamColor(info.teamId, info.teamName) : "#6B7280",
        value,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Victorias, podios y vueltas rápidas.
  const tally: Tally[] = driverEntities
    .map((entity) => {
      let wins = 0;
      let podiums = 0;
      let fastest = 0;
      for (const row of entity.rows) {
        if (isClassified(row) && row.final_position === 1) wins += 1;
        if (isClassified(row) && row.final_position <= 3) podiums += 1;
        if (row.fastest_lap_rank === 1) fastest += 1;
      }
      const lastRow = entity.rows[entity.rows.length - 1];
      return {
        id: entity.id,
        label: entity.label,
        name: lastRow?.driver_name ?? entity.label,
        color: getTeamColor(entity.teamId, entity.teamName),
        wins,
        podiums,
        fastest,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || b.fastest - a.fastest);

  return {
    rounds,
    driverPoints: drivers.points,
    constructorPoints: constructors.points,
    driverPositions: drivers.positions,
    constructorPositions: constructors.positions,
    comebacks,
    tally,
  };
}
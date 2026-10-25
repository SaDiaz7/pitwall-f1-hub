import type { GrandPrix } from "@/lib/types";

// Puntos por puesto exacto: ganador 10, 2.º y 3.º 3 puntos, 4.º al 10.º 1 punto.
// IMPORTANTE: tiene que coincidir con la función score_race de la base de datos.
export const POSITION_POINTS = [10, 3, 3, 1, 1, 1, 1, 1, 1, 1] as const;
export const PICK_COUNT = POSITION_POINTS.length;
export const MAX_POINTS = POSITION_POINTS.reduce<number>((sum, points) => sum + points, 0);

// La temporada coincide con el año de la fecha de la carrera.
export function seasonOf(gp: GrandPrix): number {
  return Number(gp.date.slice(0, 4));
}

// Las predicciones cierran cuando empieza la clasificación (la primera, si hay sprint).
export function predictionDeadline(gp: GrandPrix): string | null {
  const starts = gp.sessions
    .filter((session) => session.name.startsWith("Clasificación"))
    .map((session) => session.start)
    .sort();
  return starts[0] ?? null;
}

export function raceStartOf(gp: GrandPrix): string | null {
  return gp.sessions.find((session) => session.name === "Carrera")?.start ?? null;
}

export interface PositionScore {
  position: number;
  pick: string | null;
  result: string | null;
  hit: boolean;
  points: number;
}

// Compara, puesto por puesto, la predicción con el resultado.
export function breakdown(picks: string[], results: string[]): PositionScore[] {
  return POSITION_POINTS.map((value, index) => {
    const pick = picks[index] ?? null;
    const result = results[index] ?? null;
    const hit = pick !== null && pick === result;
    return { position: index + 1, pick, result, hit, points: hit ? value : 0 };
  });
}

export function scorePrediction(picks: string[], results: string[]): number {
  return breakdown(picks, results).reduce((sum, row) => sum + row.points, 0);
}
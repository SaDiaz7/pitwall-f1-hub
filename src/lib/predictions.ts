import type { GrandPrix } from "@/lib/types";

// Puntos por puesto exacto: ganador 10, 2.º y 3.º 3 puntos, 4.º al 10.º 1 punto.
// IMPORTANTE: tiene que coincidir con la función score_race de la base de datos.
export const POSITION_POINTS = [10, 3, 3, 1, 1, 1, 1, 1, 1, 1] as const;
export const PICK_COUNT = POSITION_POINTS.length;
export const POSITIONS_MAX_POINTS = POSITION_POINTS.reduce<number>((sum, points) => sum + points, 0);

// ---------- Predicciones extra ----------

export type BonusKey =
  | "pole"
  | "fastest_lap"
  | "safety_car"
  | "vsc"
  | "red_flag"
  | "dnf_range"
  | "colapinto_points";

// Todas las respuestas son texto: "si" / "no", el id de un piloto, o "0" / "1-2" / "3+".
export type BonusAnswers = Partial<Record<BonusKey, string>>;

export interface BonusQuestion {
  key: BonusKey;
  label: string;
  kind: "yesno" | "driver" | "dnf";
  points: number;
}

// IMPORTANTE: los puntos tienen que coincidir con la función bonus_points de la base de datos.
export const BONUS_QUESTIONS: BonusQuestion[] = [
  { key: "pole", label: "Pole position", kind: "driver", points: 3 },
  { key: "fastest_lap", label: "Vuelta rápida", kind: "driver", points: 2 },
  { key: "safety_car", label: "¿Habrá Safety Car?", kind: "yesno", points: 2 },
  { key: "vsc", label: "¿Habrá Virtual Safety Car?", kind: "yesno", points: 2 },
  { key: "red_flag", label: "¿Habrá bandera roja?", kind: "yesno", points: 2 },
  { key: "dnf_range", label: "Abandonos en la carrera", kind: "dnf", points: 2 },
  { key: "colapinto_points", label: "¿Puntúa Colapinto?", kind: "yesno", points: 2 },
];

export const YES_NO_OPTIONS = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

export const DNF_OPTIONS = [
  { value: "0", label: "Ninguno" },
  { value: "1-2", label: "1 o 2" },
  { value: "3+", label: "3 o más" },
];

export const BONUS_MAX_POINTS = BONUS_QUESTIONS.reduce((sum, question) => sum + question.points, 0);

// Máximo por carrera: top 10 más extras.
export const MAX_POINTS = POSITIONS_MAX_POINTS + BONUS_MAX_POINTS;

// Convierte lo que viene de la base en respuestas válidas (ignora cualquier cosa rara).
export function bonusOf(value: unknown): BonusAnswers {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};

  const answers: BonusAnswers = {};
  for (const question of BONUS_QUESTIONS) {
    const raw = (value as Record<string, unknown>)[question.key];
    if (typeof raw === "string" && raw !== "") answers[question.key] = raw;
  }
  return answers;
}

export interface BonusScore {
  question: BonusQuestion;
  answer: string | null;
  result: string | null;
  hit: boolean;
  points: number;
}

// Compara cada respuesta extra con el resultado (results es null mientras no se calcularon).
export function bonusBreakdown(answers: BonusAnswers, results: BonusAnswers | null): BonusScore[] {
  return BONUS_QUESTIONS.map((question) => {
    const answer = answers[question.key] ?? null;
    const result = results?.[question.key] ?? null;
    const hit = answer !== null && result !== null && answer === result;
    return { question, answer, result, hit, points: hit ? question.points : 0 };
  });
}

// Texto legible de una respuesta o resultado extra.
export function describeBonusValue(
  question: BonusQuestion,
  value: string | null,
  nameOf: (id: string | null) => string,
): string {
  if (value === null) return "—";
  if (question.kind === "yesno") return value === "si" ? "Sí" : value === "no" ? "No" : "—";
  if (question.kind === "dnf") return DNF_OPTIONS.find((option) => option.value === value)?.label ?? "—";
  return nameOf(value);
}

// ---------- Top 10 ----------

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
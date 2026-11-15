// Lógica compartida del juego diario "¿Más o menos?".

export type HlStat = "wins" | "podiums" | "poles" | "titles";
export type HlPick = "more" | "less";

export const HL_STAT_LABELS: Record<HlStat, string> = {
  wins: "victorias",
  podiums: "podios",
  poles: "poles",
  titles: "títulos",
};

export interface HlCurrent {
  round: number;
  stat: HlStat;
  a_name: string;
  a_nationality: string | null;
  a_value: number;
  b_name: string;
  b_nationality: string | null;
}

export interface HlRound {
  round: number;
  stat: HlStat;
  a_name: string;
  a_value: number;
  b_name: string;
  b_value: number;
  pick: HlPick;
  correct: boolean;
}

export interface HlGame {
  date: string;
  total: number;
  finished: boolean;
  score: number;
  streak: number;
  rounds: HlRound[];
  current: HlCurrent | null;
}

export interface HlSubmitResult {
  correct: boolean;
  stat: HlStat;
  a_value: number;
  b_value: number;
  finished: boolean;
  score: number;
  total: number;
  next: HlCurrent | null;
}

const NATIONALITIES_ES: Record<string, string> = {
  American: "Estadounidense",
  Argentine: "Argentino",
  Australian: "Australiano",
  Austrian: "Austríaco",
  Belgian: "Belga",
  Brazilian: "Brasileño",
  British: "Británico",
  Canadian: "Canadiense",
  Chilean: "Chileno",
  Chinese: "Chino",
  Colombian: "Colombiano",
  Czech: "Checo",
  Danish: "Danés",
  Dutch: "Neerlandés",
  Finnish: "Finlandés",
  French: "Francés",
  German: "Alemán",
  Hungarian: "Húngaro",
  Indonesian: "Indonesio",
  Irish: "Irlandés",
  Italian: "Italiano",
  Japanese: "Japonés",
  Mexican: "Mexicano",
  Monegasque: "Monegasco",
  "New Zealander": "Neozelandés",
  Polish: "Polaco",
  Portuguese: "Portugués",
  Rhodesian: "Rodesiano",
  Russian: "Ruso",
  "South African": "Sudafricano",
  Spanish: "Español",
  Swedish: "Sueco",
  Swiss: "Suizo",
  Thai: "Tailandés",
  Uruguayan: "Uruguayo",
  Venezuelan: "Venezolano",
};

export function nationalityEs(value: string | null): string {
  if (!value) return "";
  return NATIONALITIES_ES[value] ?? value;
}

// Texto para compartir, tipo Wordle.
export function buildHlShareText(game: HlGame): string {
  const squares = game.rounds.map((round) => (round.correct ? "🟩" : "🟥")).join("");
  const day = new Date(`${game.date}T12:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
  return `PitWall · ¿Más o menos?\n${day} · ${game.score}/${game.total}\n${squares}\n${window.location.origin}/juego`;
}
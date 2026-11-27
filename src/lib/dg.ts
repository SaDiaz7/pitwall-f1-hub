// Lógica compartida del juego diario "Adiviná el piloto".
import { nationalityEs } from "@/lib/higher-lower";

// ok = coincide · no = no coincide · up = el piloto secreto tiene un valor mayor · down = menor
export type DgHint = "ok" | "no" | "up" | "down";
export type DgColumn = "nationality" | "birth_year" | "debut" | "wins" | "podiums" | "poles" | "titles";

export const DG_COLUMNS: { key: DgColumn; label: string; title: string }[] = [
  { key: "nationality", label: "Nac.", title: "Nacionalidad" },
  { key: "birth_year", label: "Nació", title: "Año de nacimiento" },
  { key: "debut", label: "Debut", title: "Año de debut" },
  { key: "wins", label: "Vict.", title: "Victorias" },
  { key: "podiums", label: "Podios", title: "Podios" },
  { key: "poles", label: "Poles", title: "Poles" },
  { key: "titles", label: "Títulos", title: "Títulos" },
];

export interface DgDriverOption {
  id: string;
  name: string;
}

export interface DgFeedback {
  id: string;
  name: string;
  nationality: string | null;
  birth_year: number | null;
  debut: number | null;
  wins: number;
  podiums: number;
  poles: number;
  titles: number;
  correct: boolean;
  hints: Record<DgColumn, DgHint>;
}

export interface DgGame {
  date: string;
  max_attempts: number;
  finished: boolean;
  solved: boolean;
  streak: number;
  guesses: DgFeedback[];
  answer: { id: string; name: string } | null;
}

export interface DgSubmitResult {
  feedback: DgFeedback;
  attempts: number;
  solved: boolean;
  finished: boolean;
  answer: { id: string; name: string } | null;
}

export function dgCellValue(feedback: DgFeedback, key: DgColumn): string {
  if (key === "nationality") return nationalityEs(feedback.nationality) || "—";
  const value = feedback[key];
  return value === null ? "—" : String(value);
}

const HINT_EMOJI: Record<DgHint, string> = { ok: "🟩", no: "🟥", up: "🔼", down: "🔽" };

// Texto para compartir, tipo Wordle.
export function buildDgShareText(game: DgGame): string {
  const day = new Date(`${game.date}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const score = game.solved ? `${game.guesses.length}/${game.max_attempts}` : `X/${game.max_attempts}`;
  const rows = game.guesses.map((guess) => DG_COLUMNS.map((column) => HINT_EMOJI[guess.hints[column.key]]).join(""));
  return `PitWall · Adiviná el piloto\n${day} · ${score}\n${rows.join("\n")}\n${window.location.origin}/juego`;
}
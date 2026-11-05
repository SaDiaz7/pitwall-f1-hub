// Lógica compartida del juego diario "Adiviná el circuito".

export const MAX_ATTEMPTS = 6;

export type ClueKey = "length_m" | "first_gp" | "altitude_m" | "country" | "city";

export interface Clues {
  length_m?: number;
  first_gp?: number;
  altitude_m?: number;
  country?: string;
  country_code?: string;
  city?: string;
}

export interface GameCircuit {
  id: string;
  name: string;
  city: string;
}

export interface GameState {
  date: string;
  path: string;
  maxAttempts: number;
  guesses: string[];
  finished: boolean;
  solved: boolean;
  clues: Clues;
  answerId: string | null;
  streak: number;
}

// Cada pista se desbloquea al llegar a cierta cantidad de errores.
export const CLUE_SLOTS: { key: ClueKey; label: string; unlocksAfter: number }[] = [
  { key: "length_m", label: "Largo de la pista", unlocksAfter: 1 },
  { key: "first_gp", label: "Año del primer GP", unlocksAfter: 2 },
  { key: "altitude_m", label: "Altitud", unlocksAfter: 3 },
  { key: "country", label: "País", unlocksAfter: 4 },
  { key: "city", label: "Ciudad", unlocksAfter: 5 },
];

export function formatClue(key: ClueKey, clues: Clues): string | null {
  switch (key) {
    case "length_m":
      return clues.length_m === undefined
        ? null
        : `${(clues.length_m / 1000).toLocaleString("es-AR", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })} km`;
    case "first_gp":
      return clues.first_gp === undefined ? null : String(clues.first_gp);
    case "altitude_m":
      return clues.altitude_m === undefined ? null : `${clues.altitude_m.toLocaleString("es-AR")} m`;
    case "country":
      return clues.country ?? null;
    case "city":
      return clues.city ?? null;
  }
}

// Texto para compartir, tipo Wordle.
export function buildShareText(state: GameState): string {
  const squares = Array.from({ length: state.maxAttempts }, (_, i) => {
    if (i >= state.guesses.length) return "⬛";
    return state.solved && i === state.guesses.length - 1 ? "🟩" : "🟥";
  }).join("");
  const score = state.solved ? `${state.guesses.length}/${state.maxAttempts}` : `X/${state.maxAttempts}`;
  const day = new Date(`${state.date}T12:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
  return `PitWall · Adiviná el circuito\n${day} · ${score}\n${squares}\n${window.location.origin}/juego`;
}

// ---------- Progreso de visitantes (sin cuenta): se guarda en el navegador ----------

export interface GuestGame {
  date: string;
  guesses: string[];
  finished: boolean;
  solved: boolean;
  clues: Clues;
  answerId: string | null;
}

const GUEST_KEY = "pitwall-juego-diario";

export function readGuestGame(date: string): GuestGame | null {
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestGame;
    return parsed.date === date ? parsed : null;
  } catch {
    return null;
  }
}

export function writeGuestGame(game: GuestGame): void {
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(game));
  } catch {
    // Si el navegador no deja guardar, el juego igual funciona.
  }
}
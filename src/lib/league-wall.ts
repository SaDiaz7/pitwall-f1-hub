export const WALL_EMOJIS = ["🔥", "😂", "👏", "😱", "🏆"] as const;
export const WALL_MAX = 280;
export const WALL_PAGE = 30;

export type ReactionMap = Record<string, { count: number; mine: boolean }>;

export interface WallPost {
  post_id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  body: string;
  created_at: string;
  can_delete: boolean;
  reactions: ReactionMap;
}

// Mensajes de la base que sí se pueden mostrar tal cual (están en español y son claros).
const KNOWN_ERRORS = [
  "Esperá unos segundos antes de publicar de nuevo",
  "Llegaste al límite de mensajes de hoy",
  "No sos parte de esta liga",
  "El mensaje no puede estar vacío",
  "El mensaje no puede superar los 280 caracteres",
  "La publicación no existe",
];

export function wallError(error: { message?: string }, fallback: string): string {
  const message = error.message ?? "";
  return KNOWN_ERRORS.find((known) => message.includes(known)) ?? fallback;
}
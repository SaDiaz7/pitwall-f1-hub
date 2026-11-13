import type { CardFace, Rarity } from "@/lib/album";

export interface TradeCard extends CardFace {
  foil: boolean;
}

export interface FriendDuplicate extends TradeCard {
  quantity: number;
}

export interface TradeFriend {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  duplicates: number;
}

export interface TradeItem {
  trade_id: string;
  direction: "in" | "out";
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  expires_at: string;
  other: { user_id: string | null; username: string | null; display_name: string | null; avatar_url: string | null };
  you_give: TradeCard;
  you_get: TradeCard;
}

export interface RecycleInfo {
  cost: number;
  available: Partial<Record<Rarity, number>>;
  odds: Partial<Record<Rarity, Partial<Record<Rarity, number>>>>;
}

export interface RecycleResult {
  card: TradeCard & { is_new: boolean };
  consumed: { card_id: string; count: number }[];
  from: Rarity;
  to: Rarity;
}

// Mensajes de la base que se pueden mostrar tal cual (están en español y son claros).
const KNOWN_ERRORS = [
  "No tenés suficientes repetidas",
  "Solo podés intercambiar con tus amigos",
  "No podés intercambiar con vos mismo",
  "Tenés demasiadas ofertas pendientes (máximo 10)",
  "Solo podés ofrecer cartas repetidas",
  "Esa carta ya no está repetida en la colección de tu amigo",
  "Ya hiciste esa oferta",
  "La oferta ya no está disponible",
  "La oferta venció",
  "La oferta ya no se puede completar: alguna de las cartas dejó de estar repetida",
];

export function albumError(error: { message?: string }, fallback: string): string {
  const message = error.message ?? "";
  return KNOWN_ERRORS.find((known) => message.includes(known)) ?? fallback;
}
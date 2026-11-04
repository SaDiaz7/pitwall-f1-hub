import type { PostgrestError } from "@supabase/supabase-js";

// Tiene que coincidir con league_min_members() en la base de datos.
export const MIN_MEMBERS = 3;

const PENDING_KEY = "pitwall:pending-league-code";

export function inviteUrl(code: string): string {
  return `${window.location.origin}/invitacion/${code}`;
}

// Acepta el código solo o el link completo.
export function extractInviteCode(text: string): string {
  const parts = text.trim().split(/[/?#\s]+/).filter(Boolean);
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

// Los errores que escribimos en la base (raise exception) se muestran tal cual.
export function friendlyError(error: PostgrestError, fallback: string): string {
  return error.code === "P0001" ? error.message : fallback;
}

// Si alguien abre un link de invitación sin cuenta, guardamos el código para unirlo apenas entre.
export function savePendingInvite(code: string): void {
  try {
    localStorage.setItem(PENDING_KEY, code);
  } catch {
    // Sin almacenamiento disponible: no pasa nada, solo no se une solo.
  }
}

export function readPendingInvite(): string | null {
  try {
    return localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // Igual que arriba.
  }
}
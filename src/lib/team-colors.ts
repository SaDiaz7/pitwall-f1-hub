// Colores aproximados de los equipos. Se pueden ajustar a gusto.
// Los de Audi y Cadillac son estimaciones: no tengo sus colores de 2026 confirmados.
const COLORS_BY_ID: Record<string, string> = {
  mercedes: "#27F4D2",
  ferrari: "#E8002D",
  mclaren: "#FF8000",
  red_bull: "#3671C6",
  aston_martin: "#229971",
  alpine: "#0093CC",
  williams: "#64C4FF",
  rb: "#6692FF",
  haas: "#B6BABD",
  sauber: "#52E252",
  audi: "#F50537",
  cadillac: "#9CA3AF",
};

// Si el identificador no está, se busca por palabras del nombre del equipo.
const COLORS_BY_NAME: [string, string][] = [
  ["mercedes", "#27F4D2"],
  ["ferrari", "#E8002D"],
  ["mclaren", "#FF8000"],
  ["red bull", "#3671C6"],
  ["aston martin", "#229971"],
  ["alpine", "#0093CC"],
  ["williams", "#64C4FF"],
  ["racing bulls", "#6692FF"],
  ["rb f1", "#6692FF"],
  ["haas", "#B6BABD"],
  ["sauber", "#52E252"],
  ["audi", "#F50537"],
  ["cadillac", "#9CA3AF"],
];

export const FALLBACK_TEAM_COLOR = "#6B7280";

export function getTeamColor(teamId?: string | null, teamName?: string | null): string {
  const byId = teamId ? COLORS_BY_ID[teamId.toLowerCase()] : undefined;
  if (byId) return byId;

  const name = teamName?.toLowerCase() ?? "";
  const byName = COLORS_BY_NAME.find(([keyword]) => name.includes(keyword));
  return byName ? byName[1] : FALLBACK_TEAM_COLOR;
}
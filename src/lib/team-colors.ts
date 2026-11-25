// Colores aproximados de los equipos. Se pueden ajustar a gusto.
// Los de Audi y Cadillac son estimaciones: no tengo sus colores de 2026 confirmados.
const COLORS_BY_ID: Record<string, string> = {
  mercedes: "#27F4D2",
  ferrari: "#E8002D",
  mclaren: "#FF8000",
  mcl: "#FF4230",
  red_bull: "#3671C6",
  aston_martin: "#037A68",
  alpine: "#d961d3",
  williams: "#1e1493",
  rb: "#6692FF",
  haas: "#ff4040",
  sauber: "#52E252",
  audi: "#731a1a",
  cadillac: "#d3d3d3",
  lotus: "#B6995B",
  toro_rosso: "#00144A",
  renault: "#303030",
  maserati: "#E8002D",
  alphatauri: "#192136",
  brawn: "#cccccc",
  renault2005: "#ffd500",
  alfa_romeo: "#9B1B30",
};

// Si el identificador no está, se busca por palabras del nombre del equipo.
const COLORS_BY_NAME: [string, string][] = [
  ["mercedes", "#27F4D2"],
  ["ferrari", "#E8002D"],
  ["mclaren", "#FF8000"],
  ["mcl", "#FF4230"],
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
  ["brawn", "#cccccc"],
  ["renault2005", "#ffd500"],
  ["alfa_romeo", "#9B1B30"],
];

export const FALLBACK_TEAM_COLOR = "#6B7280";

export function getTeamColor(teamId?: string | null, teamName?: string | null): string {
  const byId = teamId ? COLORS_BY_ID[teamId.toLowerCase()] : undefined;
  if (byId) return byId;

  const name = teamName?.toLowerCase() ?? "";
  const byName = COLORS_BY_NAME.find(([keyword]) => name.includes(keyword));
  return byName ? byName[1] : FALLBACK_TEAM_COLOR;
}
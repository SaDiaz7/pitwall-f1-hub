import type { Driver } from "@/lib/types";

export type CardKind = "driver" | "team" | "circuit";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Común",
  rare: "Rara",
  epic: "Épica",
  legendary: "Legendaria",
};

export const KIND_LABELS: Record<CardKind, string> = {
  driver: "Piloto",
  team: "Escudería",
  circuit: "Circuito",
};

export interface AlbumCard {
  card_id: string;
  kind: CardKind;
  name: string;
  subtitle: string | null;
  rarity: Rarity;
  foil: boolean;
  is_new: boolean;
  stats: Record<string, unknown>;
}

export interface CatalogCardInput {
  id: string;
  kind: CardKind;
  ref_id: string;
  season: number;
  name: string;
  subtitle: string | null;
  rarity: Rarity;
  stats: Record<string, unknown>;
}

// Arma las cartas de pilotos y escuderías a partir del campeonato actual.
// La rareza depende de la posición en la tabla. Las escuderías suman los puntos de sus pilotos actuales.
export function buildCatalogCards(drivers: Driver[], season: number): CatalogCardInput[] {
  const cards: CatalogCardInput[] = [];

  drivers.forEach((driver, index) => {
    const position = index + 1;
    const rarity: Rarity =
      position === 1 ? "legendary" : position <= 3 ? "epic" : driver.points > 0 ? "rare" : "common";

    cards.push({
      id: `driver:${season}:${driver.id}`,
      kind: "driver",
      ref_id: driver.id,
      season,
      name: driver.name,
      subtitle: driver.teamName ?? null,
      rarity,
      stats: {
        number: driver.number,
        team_id: driver.teamId,
        team_name: driver.teamName ?? null,
        points: driver.points,
        wins: driver.wins,
        position,
        wiki_url: driver.wikiUrl ?? null,
      },
    });
  });

  const teams = new Map<string, { id: string; name: string; points: number; wins: number }>();
  for (const driver of drivers) {
    const team = teams.get(driver.teamId) ?? {
      id: driver.teamId,
      name: driver.teamName ?? driver.teamId,
      points: 0,
      wins: 0,
    };
    team.points += driver.points;
    team.wins += driver.wins;
    teams.set(driver.teamId, team);
  }

  [...teams.values()]
    .sort((a, b) => b.points - a.points)
    .forEach((team, index) => {
      const position = index + 1;
      const rarity: Rarity = position === 1 ? "epic" : position <= 4 ? "rare" : "common";

      cards.push({
        id: `team:${season}:${team.id}`,
        kind: "team",
        ref_id: team.id,
        season,
        name: team.name,
        subtitle: `Escudería ${season}`,
        rarity,
        stats: { team_id: team.id, team_name: team.name, points: team.points, wins: team.wins, position },
      });
    });

  return cards;
}
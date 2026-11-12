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

export const KIND_ORDER: CardKind[] = ["driver", "team", "circuit"];

// 0 = la más rara. Sirve para ordenar de las mejores a las comunes.
export const RARITY_RANK: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };

// Lo mínimo para dibujar una carta.
export interface CardFace {
  card_id: string;
  kind: CardKind;
  name: string;
  subtitle: string | null;
  rarity: Rarity;
  stats: Record<string, unknown>;
}

// Una carta del catálogo con cuántas tiene la persona (normales y foil) y su número dentro de su tipo.
export interface AlbumEntry extends CardFace {
  quantity: number;
  foil_quantity: number;
  number: number;
}

export function statNum(stats: Record<string, unknown>, key: string): number | null {
  const value = stats[key];
  return typeof value === "number" ? value : null;
}

export function statStr(stats: Record<string, unknown>, key: string): string | null {
  const value = stats[key];
  return typeof value === "string" ? value : null;
}

// Dirección de la imagen de una carta. Las imágenes viven en /public/cards.
// - Si la carta tiene "image" (en la tabla album_cards), se usa ese archivo.
// - Si es de piloto y no tiene, se busca "<id del piloto>.png" (por ejemplo piastri.png).
export function cardImageUrl(card: Pick<CardFace, "kind" | "card_id" | "stats">): string | null {
  const explicit = statStr(card.stats, "image");
  if (explicit) return `/cards/${explicit}`;
  if (card.kind !== "driver") return null;
  const ref = card.card_id.split(":").pop();
  return ref ? `/cards/${ref}.png` : null;
}
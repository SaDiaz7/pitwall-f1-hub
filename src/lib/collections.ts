import type { AlbumCard } from "@/lib/album";

// Una colección activa con tu progreso (la arma la función album_get_collections).
export interface Collection {
  id: string;
  name: string;
  description: string | null;
  reward_outcome: string;
  reward_count: number | null;
  card_ids: string[];
  owned: number;
  claimed: boolean;
  claimed_cards: AlbumCard[] | null;
}
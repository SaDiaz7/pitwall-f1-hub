import {
  Award,
  Compass,
  Eye,
  Flag,
  Flame,
  Layers,
  Sparkles,
  Target,
  ThumbsUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface BadgeStats {
  streak_current: number;
  streak_best: number;
  game_solved: number;
  game_first_try: number;
  pred_races: number;
  pred_exact_hits: number;
  pred_perfect_podiums: number;
  pred_best_points: number;
  dotd_vote_count: number;
  friend_count: number;
  album_owned: number;
  album_foils: number;
}

// 0 = bloqueada, 1 = bronce, 2 = plata, 3 = oro.
export type Tier = 0 | 1 | 2 | 3;
export const TIER_NAMES = ["Bloqueada", "Bronce", "Plata", "Oro"] as const;

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  unit: string;
  targets: readonly [number, number, number];
  value: (stats: BadgeStats) => number;
}

export const BADGES: readonly BadgeDef[] = [
  {
    id: "racha",
    name: "Racha imparable",
    description: "Días seguidos resolviendo el circuito del juego diario.",
    icon: Flame,
    unit: "días",
    targets: [3, 7, 30],
    value: (s) => s.streak_best,
  },
  {
    id: "ojo",
    name: "Ojo de halcón",
    description: "Circuitos adivinados al primer intento.",
    icon: Eye,
    unit: "circuitos",
    targets: [1, 10, 30],
    value: (s) => s.game_first_try,
  },
  {
    id: "mapa",
    name: "Mapa en la cabeza",
    description: "Circuitos adivinados en total.",
    icon: Compass,
    unit: "circuitos",
    targets: [5, 25, 100],
    value: (s) => s.game_solved,
  },
  {
    id: "cristal",
    name: "Bola de cristal",
    description: "Pilotos acertados en su puesto exacto en tus predicciones.",
    icon: Target,
    unit: "aciertos",
    targets: [10, 50, 150],
    value: (s) => s.pred_exact_hits,
  },
  {
    id: "podio",
    name: "Podio perfecto",
    description: "Carreras con el podio completo acertado.",
    icon: Award,
    unit: "carreras",
    targets: [1, 3, 10],
    value: (s) => s.pred_perfect_podiums,
  },
  {
    id: "fiel",
    name: "Fiel a la parrilla",
    description: "Carreras con predicción puntuada.",
    icon: Flag,
    unit: "carreras",
    targets: [5, 15, 30],
    value: (s) => s.pred_races,
  },
  {
    id: "golpe",
    name: "Golpe maestro",
    description: "Tu mejor carrera de predicciones, en puntos.",
    icon: Zap,
    unit: "pts",
    targets: [15, 25, 35],
    value: (s) => s.pred_best_points,
  },
  {
    id: "voz",
    name: "Voz del pueblo",
    description: "Votos en el Piloto del día.",
    icon: ThumbsUp,
    unit: "votos",
    targets: [1, 5, 15],
    value: (s) => s.dotd_vote_count,
  },
  {
    id: "paddock",
    name: "Paddock social",
    description: "Amigos en PitWall.",
    icon: Users,
    unit: "amigos",
    targets: [1, 5, 10],
    value: (s) => s.friend_count,
  },
  {
    id: "coleccionista",
    name: "Coleccionista",
    description: "Cartas distintas en tu álbum.",
    icon: Layers,
    unit: "cartas",
    targets: [10, 30, 60],
    value: (s) => s.album_owned,
  },
  {
    id: "foil",
    name: "Cazador de foil",
    description: "Cartas con efecto foil.",
    icon: Sparkles,
    unit: "foil",
    targets: [1, 5, 15],
    value: (s) => s.album_foils,
  },
];

export function tierOf(def: BadgeDef, value: number): Tier {
  if (value >= def.targets[2]) return 3;
  if (value >= def.targets[1]) return 2;
  if (value >= def.targets[0]) return 1;
  return 0;
}
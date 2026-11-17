import type { CardFace } from "@/lib/album";

interface NamedCount {
  driver_id: string;
  driver_name: string;
  count: number;
}

export interface WrappedData {
  season: number;
  profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    country: string | null;
    member_since: string;
  } | null;
  predictions: {
    made: number;
    scored_races: number;
    season_races: number;
    points: number;
    avg_points: number | null;
    best_race: { round: number; race: string | null; points: number } | null;
    exact_hits: number;
    perfect_podiums: number;
    top_winner_pick: NamedCount | null;
    rank: number | null;
    players: number | null;
    friends_rank: number | null;
    friends_count: number | null;
  };
  games: {
    days_played: number;
    streak_best: number;
    streak_current: number;
    circuit_played: number;
    circuit_solved: number;
    circuit_first_try: number;
    circuit_avg_attempts: number | null;
    hl_days: number;
    hl_duels: number;
    hl_correct: number;
    hl_best: number;
    hl_perfect: number;
    hl_avg: number | null;
  };
  album: {
    cards: number;
    distinct: number;
    catalog: number;
    foil: number;
    packs: number;
    trades: number;
    rarest: (CardFace & { foil: boolean }) | null;
    by_rarity: Record<string, number>;
  };
  dotd: { votes: number; top_voted: NamedCount | null };
  favorites: {
    drivers: { driver_id: string; driver_name: string; team_id: string | null }[];
    teams: string[];
  };
  social: {
    friends: number;
    leagues: number;
    trophies: { league_name: string; total_points: number; member_count: number }[];
    wallpaper_likes: number;
    wallpaper_uploads: number;
    bingo_marked: number;
  };
}

// Lo que devuelve get_profile_badge_stats (sin los datos del álbum, que salen del resumen).
export interface BadgeStatsRow {
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
}

// Cuando termina Abu Dhabi (6 de diciembre de 2026) el resumen pasa a llamarse "Tu temporada".
export const SEASON_END = new Date("2026-12-07T00:00:00-03:00").getTime();

function titleCase(id: string): string {
  return id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// "senna" -> "Senna", "max_verstappen" -> "Max Verstappen". Los nombres que ya vienen bien se dejan igual.
export function prettyName(name: string): string {
  return name === name.toLowerCase() && !name.includes(" ") ? titleCase(name) : name;
}

const TEAM_NAMES: Record<string, string> = {
  alpine: "Alpine",
  aston_martin: "Aston Martin",
  audi: "Audi",
  cadillac: "Cadillac",
  ferrari: "Ferrari",
  haas: "Haas",
  mclaren: "McLaren",
  mercedes: "Mercedes",
  racing_bulls: "Racing Bulls",
  red_bull: "Red Bull",
  rb: "RB",
  sauber: "Sauber",
  williams: "Williams",
};

export function teamLabel(id: string): string {
  return TEAM_NAMES[id] ?? titleCase(id);
}
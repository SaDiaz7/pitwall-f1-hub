export interface Team {
  id: string;
  name: string;
  points: number;
  wins: number;
}

export interface Driver {
  id: string;
  name: string;
  number: number;
  teamId: string;
  points: number;
  wins: number;
}

export type GrandPrixStatus = "finalizado" | "proximo";

export interface GrandPrix {
  id: string;
  round: number;
  name: string;
  circuit: string;
  country: string;
  date: string; // ISO yyyy-mm-dd
  status: GrandPrixStatus;
}

import type { Driver, GrandPrix } from "@/lib/types";

// Puntos del reglamento. Según mi información: carrera 25-18-15-12-10-8-6-4-2-1,
// sprint 8-7-6-5-4-3-2-1, sin punto por vuelta rápida. Revisalos contra el reglamento vigente.
export const RACE_WIN_POINTS = 25;
export const RACE_SECOND_POINTS = 18;
export const SPRINT_WIN_POINTS = 8;
export const SPRINT_SECOND_POINTS = 7;

export interface Remaining {
  races: number;
  sprints: number;
  maxPoints: number; // máximo que puede sumar un piloto si gana todo lo que queda
  swingIfOneTwo: number; // lo que descuenta el ganador si el otro termina 2.º en todo
}

// Cuenta lo que falta de la temporada a partir del calendario.
export function getRemaining(schedule: GrandPrix[]): Remaining {
  const upcoming = schedule.filter((gp) => gp.status === "proximo");
  const races = upcoming.length;
  const sprints = upcoming.filter((gp) => gp.sessions.some((s) => s.name === "Sprint")).length;

  return {
    races,
    sprints,
    maxPoints: races * RACE_WIN_POINTS + sprints * SPRINT_WIN_POINTS,
    swingIfOneTwo:
      races * (RACE_WIN_POINTS - RACE_SECOND_POINTS) + sprints * (SPRINT_WIN_POINTS - SPRINT_SECOND_POINTS),
  };
}

export type TitleStatus = "champion" | "leader" | "alive" | "tiebreak" | "eliminated";

export interface TitleAnalysis {
  status: TitleStatus;
  position: number;
  driver: Driver;
  rival: Driver; // contra quién se mide: el líder, o el 2.º si el piloto es el líder
  difference: number; // puntos que separan al piloto de su rival
  maxFinal: number; // máximo de puntos con los que podría terminar
  extraNeeded: number; // puntos que el rival debería perder además de terminar 2.º en todo
}

// `drivers` tiene que venir en el orden del campeonato.
export function analyzeTitle(drivers: Driver[], selectedId: string, remaining: Remaining): TitleAnalysis | null {
  const index = drivers.findIndex((d) => d.id === selectedId);
  const driver = drivers[index];
  if (index === -1 || !driver) return null;

  const maxFinal = driver.points + remaining.maxPoints;

  // El piloto lidera: su rival es el 2.º.
  if (index === 0) {
    const rival = drivers[1];
    if (!rival) return null;

    const lead = driver.points - rival.points;
    // Es campeón si ni ganando todo (con el líder en 0 puntos) lo alcanzan.
    const status: TitleStatus = lead > remaining.maxPoints ? "champion" : "leader";
    return { status, position: 1, driver, rival, difference: lead, maxFinal, extraNeeded: 0 };
  }

  // El piloto persigue al líder.
  const rival = drivers[0];
  if (!rival) return null;

  const gap = rival.points - driver.points;
  let status: TitleStatus = "alive";
  if (maxFinal < rival.points) status = "eliminated";
  else if (maxFinal === rival.points) status = "tiebreak";

  // Si gana todo y el líder termina 2.º en todo, le descuenta `swingIfOneTwo`.
  const extraNeeded = Math.max(0, gap - remaining.swingIfOneTwo + 1);

  return { status, position: index + 1, driver, rival, difference: gap, maxFinal, extraNeeded };
}

export interface Contender {
  driver: Driver;
  position: number;
  maxFinal: number;
  gap: number; // puntos que lo separan del líder
}

// Pilotos que todavía pueden ser campeones (aunque sea por desempate).
export function getContenders(drivers: Driver[], remaining: Remaining): { alive: Contender[]; eliminated: number } {
  const leader = drivers[0];
  if (!leader) return { alive: [], eliminated: 0 };

  const alive: Contender[] = [];
  drivers.forEach((driver, index) => {
    const maxFinal = driver.points + remaining.maxPoints;
    if (index === 0 || maxFinal >= leader.points) {
      alive.push({ driver, position: index + 1, maxFinal, gap: leader.points - driver.points });
    }
  });

  return { alive, eliminated: drivers.length - alive.length };
}
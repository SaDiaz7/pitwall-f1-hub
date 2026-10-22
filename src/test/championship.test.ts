import { describe, expect, it } from "vitest";
import { analyzeTitle, getContenders, getRemaining } from "../lib/championship";
import type { Driver, GrandPrix } from "../lib/types";

const driver = (id: string, points: number): Driver => ({
  id,
  name: id,
  number: 1,
  teamId: "t",
  teamName: "T",
  points,
  wins: 0,
});

const gp = (round: number, status: "finalizado" | "proximo", sprint = false): GrandPrix => ({
  id: String(round),
  round,
  name: `GP ${round}`,
  circuit: "c",
  country: "x",
  date: "2026-01-01",
  status,
  circuitId: "c",
  locality: "l",
  lat: 0,
  lng: 0,
  sessions: sprint ? [{ name: "Sprint", start: "2026-01-01T00:00:00.000Z" }] : [],
});

// Quedan 2 carreras y 1 sprint: 2 × 25 + 8 = 58 puntos en juego.
const remaining = getRemaining([gp(1, "finalizado"), gp(2, "proximo"), gp(3, "proximo", true)]);

describe("calculadora de título", () => {
  it("cuenta lo que queda", () => {
    expect(remaining.races).toBe(2);
    expect(remaining.sprints).toBe(1);
    expect(remaining.maxPoints).toBe(58);
    expect(remaining.swingIfOneTwo).toBe(15); // 2 × 7 + 1
  });

  it("marca campeón matemático si la ventaja supera lo que queda", () => {
    const drivers = [driver("a", 200), driver("b", 100)];
    expect(analyzeTitle(drivers, "a", remaining)?.status).toBe("champion");
  });

  it("marca líder si todavía lo pueden alcanzar", () => {
    const drivers = [driver("a", 100), driver("b", 90)];
    expect(analyzeTitle(drivers, "a", remaining)?.status).toBe("leader");
  });

  it("un perseguidor cercano se consagra ganando todo", () => {
    const drivers = [driver("a", 100), driver("b", 90)];
    const result = analyzeTitle(drivers, "b", remaining);
    expect(result?.status).toBe("alive");
    expect(result?.extraNeeded).toBe(0); // 90 + 58 = 148 contra 100 + 43 = 143
  });

  it("un perseguidor lejano necesita ayuda", () => {
    const drivers = [driver("a", 100), driver("b", 60)];
    const result = analyzeTitle(drivers, "b", remaining);
    expect(result?.status).toBe("alive");
    expect(result?.extraNeeded).toBe(26); // brecha 40 − 15 + 1
  });

  it("marca eliminado y desempate", () => {
    const drivers = [driver("a", 100), driver("b", 42), driver("c", 30)];
    expect(analyzeTitle(drivers, "b", remaining)?.status).toBe("tiebreak"); // 42 + 58 = 100
    expect(analyzeTitle(drivers, "c", remaining)?.status).toBe("eliminated"); // 30 + 58 = 88
  });

  it("lista a quienes siguen con chances", () => {
    const drivers = [driver("a", 100), driver("b", 42), driver("c", 30)];
    const { alive, eliminated } = getContenders(drivers, remaining);
    expect(alive.map((c) => c.driver.id)).toEqual(["a", "b"]);
    expect(eliminated).toBe(1);
  });
});
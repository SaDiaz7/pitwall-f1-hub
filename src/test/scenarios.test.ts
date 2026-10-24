import { describe, expect, it } from "vitest";
import { bestAllowedForB, buildEvents, computeDuel, verdictOf, winsToClinch } from "../lib/scenarios";
import type { Driver, GrandPrix } from "../lib/types";

const driver = (id: string, points: number, wins = 0): Driver => ({
  id,
  name: id,
  number: 1,
  teamId: "t",
  teamName: "T",
  points,
  wins,
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

describe("escenarios", () => {
  it("arma los eventos que faltan, con el sprint antes de la carrera", () => {
    const events = buildEvents([gp(1, "finalizado"), gp(2, "proximo", true), gp(3, "proximo")]);
    expect(events.map((e) => e.id)).toEqual(["2-sprint", "2-race", "3-race"]);
  });

  it("suma puntos y victorias, y descarta los puestos repetidos", () => {
    const events = buildEvents([gp(1, "proximo")]);
    const a = driver("a", 50, 1);
    const b = driver("b", 60, 2);

    const conflict = computeDuel(a, b, events, { "1-race": { a: 1, b: 1 } });
    expect(conflict.conflicts).toEqual(["1-race"]);
    expect(conflict.aTotal).toBe(50);

    const ok = computeDuel(a, b, events, { "1-race": { a: 1, b: 2 } });
    expect(ok.aTotal).toBe(75); // 50 + 25
    expect(ok.bTotal).toBe(78); // 60 + 18
    expect(ok.aWins).toBe(2);
    expect(ok.bWins).toBe(2);
    expect(verdictOf(ok)).toBe("b");
  });

  it("desempata por victorias", () => {
    expect(verdictOf({ aTotal: 100, bTotal: 100, aWins: 3, bWins: 2, conflicts: [] })).toBe("a");
    expect(verdictOf({ aTotal: 100, bTotal: 100, aWins: 2, bWins: 2, conflicts: [] })).toBe("tie");
  });

  it("calcula las victorias que aseguran el título", () => {
    expect(winsToClinch(10, 2, 0)).toBe(2);
    expect(winsToClinch(60, 2, 0)).toBe(0); // ya está asegurado
    expect(winsToClinch(0, 3, 0)).toBe(3);
    expect(winsToClinch(0, 1, 1)).toBeNull(); // con un sprint de por medio no alcanza
  });

  it("calcula el mejor puesto que puede ocupar el rival", () => {
    const events = buildEvents([gp(1, "proximo"), gp(2, "proximo")]);
    const aWinsBoth = { "1-race": { a: 1, b: 0 }, "2-race": { a: 1, b: 0 } };

    // A: 90 + 50 = 140. B (100) como mucho 2.º: 100 + 36 = 136. A gana siempre.
    expect(bestAllowedForB(driver("a", 90), driver("b", 100), events, aWinsBoth)).toEqual({ status: "always" });

    // A: 80 + 50 = 130. B tiene que terminar 4.º o peor (3.º lo dejaría empatado en 130).
    expect(bestAllowedForB(driver("a", 80), driver("b", 100), events, aWinsBoth)).toEqual({
      status: "limit",
      position: 4,
    });

    // Sin resultados cargados para A, no alcanza aunque B no sume.
    expect(bestAllowedForB(driver("a", 0), driver("b", 100), events, {})).toEqual({ status: "never" });
  });
});
import { describe, expect, it } from "vitest";
import { MAX_POINTS, breakdown, scorePrediction } from "../lib/predictions";

const grid = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

describe("puntaje de predicciones", () => {
  it("el máximo son 23 puntos", () => {
    expect(MAX_POINTS).toBe(23); // 10 + 3 + 3 + 7 × 1
    expect(scorePrediction(grid, grid)).toBe(23);
  });

  it("no suma si no acertás ningún puesto", () => {
    expect(scorePrediction([...grid].reverse(), grid)).toBe(0);
  });

  it("suma por puesto exacto", () => {
    // Acierta 1.º (10) y 4.º, 5.º, 8.º, 9.º, 10.º (1 cada uno); falla el podio cruzado y 6.º-7.º.
    const picks = ["a", "c", "b", "d", "e", "g", "f", "h", "i", "j"];
    expect(scorePrediction(picks, grid)).toBe(15);
    expect(breakdown(picks, grid).filter((row) => row.hit)).toHaveLength(6);
  });
});
import { describe, expect, it } from "vitest";
import { abilityModifier } from "../src/domain/index.js";

const expected: [number, number][] = [
  [3, -3],
  [4, -2],
  [5, -2],
  [6, -1],
  [7, -1],
  [8, -1],
  [9, 0],
  [10, 0],
  [11, 0],
  [12, 0],
  [13, 1],
  [14, 1],
  [15, 1],
  [16, 2],
  [17, 2],
  [18, 3],
];

describe("Table 1-1", () => {
  it("every score and band", () => {
    for (const [score, modifier] of expected) {
      expect(abilityModifier(score), `score ${score}`).toBe(modifier);
    }
  });

  it("rejects scores 3d6 cannot make", () => {
    expect(() => abilityModifier(2)).toThrow(RangeError);
    expect(() => abilityModifier(19)).toThrow(RangeError);
  });
});

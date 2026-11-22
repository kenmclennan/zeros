import { describe, expect, it } from "vitest";
import { rollZero } from "../src/domain/index.js";
import { script, scriptedDice } from "./helpers.js";

const hp = (stamina: number, die: number, luck = 10, augur = 6) =>
  rollZero(scriptedDice(script({ stamina, luck }, augur, die))).hitPoints;

describe("hit points", () => {
  it.each([
    ["raw -2 floors to 1", 3, 1, 1],
    ["raw 0 floors to 1", 6, 1, 1],
    ["raw exactly 1 stays 1", 6, 2, 1],
    ["Stamina 9 with d4 1 is exactly on the floor", 9, 1, 1],
    ["no cap above", 18, 4, 7],
    ["plain roll", 10, 3, 3],
  ])("floor: %s", (_name, stamina, die, expected) => {
    expect(hp(stamina, die)).toBe(expected);
  });

  it("applies the Luck modifier on augur 25 before the floor", () => {
    expect(hp(10, 4, 3, 25)).toBe(1);
    expect(hp(10, 3, 3, 25)).toBe(1);
    expect(hp(10, 4, 18, 25)).toBe(7);
  });

  it("ignores the Luck modifier on other augurs", () => {
    expect(hp(10, 4, 18, 24)).toBe(4);
  });
});

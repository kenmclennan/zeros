import { describe, expect, it } from "vitest";
import { rollZero } from "../src/domain/index.js";
import { script, scriptedDice } from "./helpers.js";

const languages = (intelligence: number, luck = 10, augur = 6) =>
  rollZero(scriptedDice(script({ intelligence, luck }, augur, 2))).languages;

describe("languages", () => {
  it.each([
    [3, 0, false],
    [5, 0, false],
    [6, 0, true],
    [7, 0, true],
    [8, 0, true],
    [12, 0, true],
    [13, 1, true],
    [16, 2, true],
    [18, 3, true],
  ])("every edge: Int %i gives %i extra, reads and writes %s", (int, extra, reads) => {
    expect(languages(int)).toEqual({
      common: true,
      racial: null,
      extraLanguages: extra,
      canReadAndWrite: reads,
    });
  });

  it.each([
    [10, 18, 3],
    [14, 3, 0],
    [7, 18, 0],
    [13, 3, 0],
  ])("augur 29: Int %i with Luck %i gives %i extra", (int, luck, extra) => {
    expect(languages(int, luck, 29).extraLanguages).toBe(extra);
  });
});

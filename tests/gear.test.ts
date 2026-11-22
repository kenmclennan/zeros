import { describe, expect, it } from "vitest";
import { equipmentTable, rollZero } from "../src/domain/index.js";
import { script, scriptedDice } from "./helpers.js";

function roll(tail: number[], options?: Parameters<typeof rollZero>[1]) {
  const dice = scriptedDice(script({}, 1, 1, tail));
  return { zero: rollZero(dice, options), dice };
}

describe("gear", () => {
  it("equipment money and alignment", () => {
    expect(roll([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100]).zero.equipment).toBe("Backpack");
    expect(roll([1, 24, 1, 1, 1, 1, 1, 1, 1, 1, 100]).zero.equipment).toBe("Waterskin");
    expect(roll([1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 100]).zero.equipment).toBe("10' chain");
    expect(equipmentTable).toHaveLength(24);

    expect(roll([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100]).zero.money.copper).toBe(5);
    expect(roll([1, 1, 12, 12, 12, 12, 12, 1, 1, 1, 100]).zero.money.copper).toBe(60);

    const alignments = [1, 2, 3, 4, 5, 6].map(
      (a) => roll([1, 1, 1, 1, 1, 1, 1, a, 1, 1, 100]).zero.alignment,
    );
    expect(alignments).toEqual(["lawful", "lawful", "neutral", "neutral", "chaotic", "chaotic"]);

    const fixed = roll([1, 1, 1, 1, 1, 1, 1, 1, 1, 100], { alignment: "chaotic" });
    expect(fixed.zero.alignment).toBe("chaotic");
    expect(fixed.dice.sidesAsked.slice(20)).toEqual([
      100, 24, 12, 12, 12, 12, 12, 2, 100, 100, 10, 20, 10, 20,
    ]);
    expect(fixed.dice.consumed()).toBe(34);
  });

  it("race is human", () => {
    expect(roll([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100]).zero.race).toBe("human");
  });
});

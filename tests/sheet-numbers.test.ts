import { describe, expect, it } from "vitest";
import { rollZero } from "../src/domain/index.js";
import { script, scriptedDice } from "./helpers.js";

describe("sheet numbers", () => {
  it("derived numbers", () => {
    const zero = rollZero(
      scriptedDice(script({ strength: 16, agility: 4, stamina: 18, personality: 13 }, 6, 3)),
    );
    expect(zero.saves).toEqual({ reflex: -2, fortitude: 3, will: 1 });
    expect(zero.initiative).toBe(-2);
    expect(zero.armorClass).toBe(8);
    expect(zero.attack).toEqual({ melee: 2, missile: -2 });
    expect(zero.speed).toBe(30);
    expect(zero.crit).toEqual({ die: 4, table: "I" });
    expect(zero.experience).toBe(0);
    expect(zero.hitPoints).toBe(6);
  });

  it("matches the worked example", () => {
    const zero = rollZero(
      scriptedDice(
        script(
          { strength: 16, agility: 4, stamina: 18, personality: 13, intelligence: 12, luck: 9 },
          23,
          3,
        ),
      ),
    );
    expect(zero.hitPoints).toBe(6);
    expect(zero.armorClass).toBe(8);
    expect(zero.speed).toBe(30);
  });

  it("adds Luck 18 to armor class on augur 23", () => {
    const zero = rollZero(scriptedDice(script({ agility: 4, luck: 18 }, 23, 3)));
    expect(zero.armorClass).toBe(11);
  });
});

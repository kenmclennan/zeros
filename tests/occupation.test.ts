import { describe, expect, it } from "vitest";
import { lookupOccupation, occupationTable, rollZero, weaponTable } from "../src/domain/index.js";
import { physicianRow, script, scriptedDice } from "./helpers.js";

const called: Record<number, [string, string]> = {
  9: ["Longsword", "1d8"],
  15: ["Javelin", "1d6"],
  35: ["Staff", "1d4"],
  53: ["Dart", "1d4"],
  55: ["Handaxe", "1d6"],
  62: ["Handaxe", "1d6"],
  51: ["Warhammer", "1d8"],
  14: ["Club", "1d4"],
  64: ["Whip", "1d3"],
  68: ["Two-handed sword", "1d10"],
  69: ["Shortbow", "1d6"],
  18: ["Dagger", "1d4"],
};

describe("occupation", () => {
  it("weapon readings", () => {
    for (const [roll, [fightsAs, damage]] of Object.entries(called)) {
      const weapon = lookupOccupation(Number(roll)).weapon;
      expect([weapon.fightsAs, weapon.damage], `roll ${roll}`).toEqual([fightsAs, damage]);
    }
    for (const row of occupationTable) {
      const { weapon } = lookupOccupation(row.from);
      expect(weapon.written).toBe(row.weapon);
      if (weapon.fightsAs !== "Whip") {
        expect(weaponTable.map((w) => w.name)).toContain(weapon.fightsAs);
      }
      const bracket = row.weapon.match(/\((.+)\)$/)?.[1];
      if (
        bracket &&
        ["longsword", "dagger", "club", "spear", "dart", "handaxe"].includes(bracket)
      ) {
        expect(weapon.fightsAs.toLowerCase()).toBe(bracket);
      }
      if (!bracket && weaponTable.some((w) => w.name === row.weapon)) {
        expect(weapon.fightsAs).toBe(row.weapon);
      }
    }
  });

  it("trade goods dice", () => {
    const rolled = (occupation: number, trade: number[]) => {
      const dice = scriptedDice(
        script({}, 1, 1, [occupation, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100, ...trade]),
      );
      return { zero: rollZero(dice), dice };
    };
    const two = rolled(physicianRow, [2]);
    expect(two.zero.occupation.tradeGoods).toBe("2 doses of healing salve (1 hp each)");
    expect(two.dice.consumed()).toBe(36);
    expect(two.dice.sidesAsked.at(-5)).toBe(3);
    expect(rolled(physicianRow, [1]).zero.occupation.tradeGoods).toBe(
      "1 dose of healing salve (1 hp each)",
    );
    for (const roll of [physicianRow - 1, physicianRow + 1]) {
      const { zero, dice } = rolled(roll, []);
      expect(dice.consumed()).toBe(35);
      expect(zero.occupation.tradeGoods).toBe(occupationTable[roll - 1]?.tradeGoods);
    }
  });

  it("covers the first and last rows", () => {
    expect(lookupOccupation(1).name).toBe("Acolyte of Forgotten Gods");
    expect(lookupOccupation(100).name).toBe("Astrologer-Priest");
  });

  it("reaches every row exactly once when the die returns each value", () => {
    const names = [];
    for (let row = 1; row <= occupationTable.length; row++) {
      const dice = scriptedDice(script({}, 1, 1, [row, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100, 1, 1, 1]));
      const zero = rollZero(dice);
      expect(dice.sidesAsked[20]).toBe(occupationTable.length);
      names.push(zero.occupation.name);
    }
    expect(names).toEqual(occupationTable.map((entry) => entry.name));
    expect(new Set(names).size).toBe(occupationTable.length);
  });
});

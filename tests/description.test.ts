import { describe, expect, it } from "vitest";
import { createSeededDice } from "../src/adapters/seeded-dice.js";
import { rollFeatures } from "../src/domain/description.js";
import {
  type AbilityName,
  type AbilityScore,
  abilityNames,
  descriptionTables,
  rollZero,
} from "../src/domain/index.js";
import { scriptedDice } from "./helpers.js";

function abilitiesWith(
  overrides: Partial<Record<AbilityName, number>> = {},
): Record<AbilityName, AbilityScore> {
  const abilities = {} as Record<AbilityName, AbilityScore>;
  for (const name of abilityNames) abilities[name] = { score: 10, modifier: overrides[name] ?? 0 };
  return abilities;
}

const neutral = abilitiesWith();
const strong = abilitiesWith({ strength: 1, agility: 1, stamina: 1, intelligence: 1 });
const weak = abilitiesWith({ strength: -1, agility: -1, stamina: -1, intelligence: -1 });

describe("description", () => {
  it("rolls two features from two different categories", () => {
    const dice = scriptedDice([3, 7, 5, 2]);
    const features = rollFeatures(dice, "male", neutral);
    expect(features).toHaveLength(2);
    expect(features[0]?.category).toBe(descriptionTables.male[2]?.name);
    expect(features[1]?.category).toBe(descriptionTables.male[4]?.name);
    expect(features[0]?.feature).toBe(descriptionTables.male[2]?.features[6]?.text);
    expect(features[1]?.feature).toBe(descriptionTables.male[4]?.features[1]?.text);
    expect(dice.sidesAsked).toEqual([10, 20, 10, 20]);
    expect(dice.consumed()).toBe(4);
  });

  it("rerolls a repeated category and lands on the bounds", () => {
    const values = [3, 7, 3, 3, 10, 20];
    const dice = scriptedDice(values);
    const features = rollFeatures(dice, "male", abilitiesWith({ agility: 1 }));
    expect(features.map((f) => f.feature)).toEqual([
      "strong white teeth",
      "keeps one hand near a knife",
    ]);
    expect(features.map((f) => f.category)).toEqual(["Face", "Habit"]);
    expect(dice.sidesAsked).toEqual([10, 20, 10, 10, 10, 20]);
    expect(dice.consumed()).toBe(values.length);
  });

  it("uses the female set for a female zero", () => {
    const male = rollFeatures(scriptedDice([3, 7, 3, 3, 10, 20]), "male", neutral);
    const female = rollFeatures(scriptedDice([3, 7, 3, 3, 10, 20]), "female", neutral);
    expect(female.map((f) => f.category)).toEqual([
      descriptionTables.female[2]?.name,
      descriptionTables.female[9]?.name,
    ]);
    expect(female.map((f) => f.feature)).not.toEqual(male.map((f) => f.feature));
  });

  it("takes the first row of each table at the lower bounds", () => {
    const features = rollFeatures(scriptedDice([1, 1, 2, 1]), "male", neutral);
    expect(features).toEqual([
      {
        category: descriptionTables.male[0]?.name,
        feature: descriptionTables.male[0]?.features[0]?.text,
      },
      {
        category: descriptionTables.male[1]?.name,
        feature: descriptionTables.male[1]?.features[0]?.text,
      },
    ]);
  });

  it("skips a contradicting or zero modifier and keeps an agreeing one", () => {
    const build = descriptionTables.male[8]?.features ?? [];
    expect(build[2]).toMatchObject({ implies: "STA+" });
    expect(build[3]?.implies).toBeUndefined();
    const roll = (abilities: Record<AbilityName, AbilityScore>) =>
      rollFeatures(scriptedDice([9, 3, 1, 1]), "male", abilities)[0]?.feature;
    expect(roll(strong)).toBe(build[2]?.text);
    expect(roll(neutral)).toBe(build[3]?.text);
    expect(roll(weak)).toBe(build[3]?.text);
  });

  it("keeps a plus feature at plus one and skips it at zero", () => {
    const build = descriptionTables.male[8]?.features ?? [];
    expect(build[15]).toMatchObject({ text: "a lithe, supple body", implies: "AGI+" });
    const roll = (abilities: Record<AbilityName, AbilityScore>) =>
      rollFeatures(scriptedDice([9, 16, 1, 1]), "male", abilities)[0]?.feature;
    expect(roll(abilitiesWith({ agility: 1 }))).toBe("a lithe, supple body");
    expect(roll(neutral)).toBe(build[17]?.text);
  });

  it("wraps from entry 20 to the first allowed entry", () => {
    const build = descriptionTables.male[8]?.features ?? [];
    expect(build[19]).toMatchObject({ text: "a giant's thick frame", implies: "STR+" });
    const wrapped = rollFeatures(scriptedDice([9, 20, 1, 1]), "male", neutral);
    expect(wrapped[0]?.feature).toBe(build[3]?.text);
  });

  it("leaves an untagged roll the same whatever the abilities", () => {
    const legs = descriptionTables.male[9]?.features ?? [];
    for (const abilities of [neutral, strong, weak]) {
      const features = rollFeatures(scriptedDice([10, 1, 1, 1]), "male", abilities);
      expect(features[0]?.feature).toBe(legs[0]?.text);
    }
  });

  it("rolls no extra dice when it skips", () => {
    const dice = scriptedDice([10, 17, 1, 1]);
    rollFeatures(dice, "male", neutral);
    expect(dice.sidesAsked).toEqual([10, 20, 10, 20]);
    expect(dice.consumed()).toBe(4);
  });

  it("never gives a feature whose ability disagrees, over 2000 seeded zeros", () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const zero = rollZero(createSeededDice(seed), { heroicChance: seed % 2 === 0 ? 100 : 0 });
      for (const { category, feature } of zero.features) {
        const entry = descriptionTables[zero.sex]
          .find((c) => c.name === category)
          ?.features.find((f) => f.text === feature);
        if (entry?.implies === undefined) continue;
        const ability = { STR: "strength", AGI: "agility", STA: "stamina", INT: "intelligence" }[
          entry.implies.slice(0, 3) as "STR" | "AGI" | "STA" | "INT"
        ] as AbilityName;
        const modifier = zero.abilities[ability].modifier;
        if (entry.implies.endsWith("+"))
          expect(modifier, `${seed} ${feature}`).toBeGreaterThanOrEqual(1);
        else expect(modifier, `${seed} ${feature}`).toBeLessThanOrEqual(-1);
      }
    }
  });

  it("every seed from 1 to 200 gets two valid features", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const zero = rollZero(createSeededDice(seed));
      expect(zero.features, String(seed)).toHaveLength(2);
      expect(zero.features[0]?.category).not.toBe(zero.features[1]?.category);
      for (const { category, feature } of zero.features) {
        const entry = descriptionTables[zero.sex].find((c) => c.name === category);
        expect(
          entry?.features.map((f) => f.text),
          String(seed),
        ).toContain(feature);
      }
    }
  });
});

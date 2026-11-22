import { describe, expect, it } from "vitest";
import { descriptionTables, rollZero } from "../src/domain/index.js";
import { defaultTail, descriptionRolls, script, scriptedDice } from "./helpers.js";

describe("rollZero", () => {
  it("rolls in the stated order", () => {
    const values = [...Array(18).fill(3), 7, 2, ...defaultTail, ...descriptionRolls];
    const dice = scriptedDice(values);
    rollZero(dice);
    expect(dice.sidesAsked.slice(0, 20)).toEqual([...Array(18).fill(6), 30, 4]);
    expect(dice.consumed()).toBe(35);
  });

  it("sums three d6 per ability in strength-to-luck order", () => {
    const values = [
      ...[1, 1, 1],
      ...[2, 2, 2],
      ...[3, 3, 3],
      ...[4, 4, 4],
      ...[5, 5, 5],
      ...[6, 6, 6],
      6,
      1,
      ...defaultTail,
      ...descriptionRolls,
    ];
    const zero = rollZero(scriptedDice(values));
    expect(zero.abilities.strength.score).toBe(3);
    expect(zero.abilities.agility.score).toBe(6);
    expect(zero.abilities.stamina.score).toBe(9);
    expect(zero.abilities.personality.score).toBe(12);
    expect(zero.abilities.intelligence.score).toBe(15);
    expect(zero.abilities.luck.score).toBe(18);
  });

  it("rolls the new fields after call 20", () => {
    const tail = [...Array(18).fill(6), 30, 4, 100, 24, 12, 12, 12, 12, 12, 6, 2, 100, 100];
    const featureSides = [10, 20, 10, 20];
    const plain = scriptedDice(script({}, 1, 1));
    rollZero(plain);
    expect(plain.sidesAsked).toEqual([...tail, ...featureSides]);
    expect(plain.consumed()).toBe(35);

    const nickname = scriptedDice(script({}, 1, 1, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 40, 1]));
    rollZero(nickname);
    expect(nickname.sidesAsked).toEqual([...tail, 100, ...featureSides]);
    expect(nickname.consumed()).toBe(36);

    const fixed = scriptedDice(script({}, 1, 1, [1, 1, 1, 1, 1, 1, 1, 1, 1, 100]));
    rollZero(fixed, { alignment: "neutral" });
    expect(fixed.sidesAsked).toEqual([...tail.filter((_, i) => i !== 27), ...featureSides]);
  });

  it("keeps the first 20 outcomes", () => {
    const first = script({ strength: 13, luck: 4 }, 12, 3, []).slice(0, 20);
    const a = rollZero(
      scriptedDice([...first, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100, ...descriptionRolls]),
    );
    const b = rollZero(
      scriptedDice([...first, 99, 24, 12, 12, 12, 12, 12, 6, 2, 100, 100, ...descriptionRolls]),
    );
    expect(a.abilities).toEqual(b.abilities);
    expect(a.hitPoints).toBe(b.hitPoints);
    expect(a.luckyRoll).toEqual(b.luckyRoll);
    expect(a.abilities.strength.score).toBe(13);
  });

  it("rolls the features last", () => {
    const dice = scriptedDice(script({}, 1, 1));
    rollZero(dice);
    expect(dice.sidesAsked.slice(-4)).toEqual([10, 20, 10, 20]);

    const reroll = scriptedDice(script({}, 1, 1, defaultTail).slice(0, -4).concat([1, 1, 1, 2, 1]));
    rollZero(reroll);
    expect(reroll.sidesAsked.slice(-5)).toEqual([10, 20, 10, 10, 20]);

    const female = scriptedDice(script({}, 1, 1, [1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 100]));
    const zero = rollZero(female);
    expect(zero.sex).toBe("female");
    expect(zero.features[1]?.category).toBe(descriptionTables.female[1]?.name);
  });

  it("features do not depend on abilities", () => {
    for (const personality of [3, 18]) {
      const zero = rollZero(scriptedDice(script({ personality }, 1, 1)));
      expect(zero.features).toHaveLength(2);
    }
  });
});

import type { Dice } from "../src/domain/index.js";

export interface ScriptedDice extends Dice {
  sidesAsked: number[];
  consumed(): number;
}

export function scriptedDice(values: number[]): ScriptedDice {
  let index = 0;
  const sidesAsked: number[] = [];
  return {
    sidesAsked,
    consumed: () => index,
    roll(sides: number): number {
      const value = values[index];
      if (value === undefined) throw new Error("scripted dice exhausted");
      if (!Number.isInteger(value) || value < 1 || value > sides) {
        throw new Error(`scripted value ${value} is outside 1..${sides}`);
      }
      index++;
      sidesAsked.push(sides);
      return value;
    },
  };
}

export function abilityRolls(score: number): number[] {
  if (score < 3 || score > 18) throw new RangeError(`unreachable 3d6 score ${score}`);
  const rolls = [1, 1, 1];
  let remaining = score - 3;
  for (let i = 0; i < 3; i++) {
    const add = Math.min(5, remaining);
    rolls[i] = (rolls[i] ?? 1) + add;
    remaining -= add;
  }
  return rolls;
}

export interface Scores {
  strength?: number;
  agility?: number;
  stamina?: number;
  personality?: number;
  intelligence?: number;
  luck?: number;
}

export const descriptionRolls = [1, 1, 2, 1];

export const defaultTail = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100];

export function script(
  scores: Scores,
  luckyRoll: number,
  hitDie: number,
  tail: number[] = defaultTail,
): number[] {
  const s = {
    strength: 10,
    agility: 10,
    stamina: 10,
    personality: 10,
    intelligence: 10,
    luck: 10,
    ...scores,
  };
  return [
    ...abilityRolls(s.strength),
    ...abilityRolls(s.agility),
    ...abilityRolls(s.stamina),
    ...abilityRolls(s.personality),
    ...abilityRolls(s.intelligence),
    ...abilityRolls(s.luck),
    luckyRoll,
    hitDie,
    ...tail,
    ...descriptionRolls,
  ];
}

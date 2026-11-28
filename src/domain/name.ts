import type { Dice } from "./ports/dice.js";
import { femaleNames, maleNames, nicknames } from "./tables/names.js";

export type Sex = "male" | "female";

export interface ZeroName {
  given: string;
  nickname: string | null;
  display: string;
}

const sexSides = 2;
const nameSides = 100;
const nicknameChanceSides = 100;
const nicknameChance = 40;

function entry(table: readonly string[], roll: number): string {
  const value = table[roll - 1];
  if (value === undefined) throw new RangeError(`no entry for roll ${roll}`);
  return value;
}

export function rollSex(dice: Dice): Sex {
  return dice.roll(sexSides) === 1 ? "male" : "female";
}

export function rollName(dice: Dice, sex: Sex): ZeroName {
  const given = entry(sex === "male" ? maleNames : femaleNames, dice.roll(nameSides));
  const takesNickname = dice.roll(nicknameChanceSides) <= nicknameChance;
  if (!takesNickname) return { given, nickname: null, display: given };
  const nickname = entry(nicknames, dice.roll(nameSides));
  return { given, nickname, display: `${given} ${nickname}` };
}

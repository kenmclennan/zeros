import type { Dice } from "./ports/dice.js";

export type Race = "human" | "dwarf" | "elf" | "halfling";
export type RacialLanguage = "Dwarvish" | "Elvish" | "Halfling";

const demihumanChanceSides = 100;
const demihumanRaces: readonly Race[] = ["dwarf", "elf", "halfling"];

const baseSpeeds: Readonly<Record<Race, number>> = {
  human: 30,
  dwarf: 20,
  elf: 30,
  halfling: 20,
};

const racialLanguages: Readonly<Record<Race, RacialLanguage | null>> = {
  human: null,
  dwarf: "Dwarvish",
  elf: "Elvish",
  halfling: "Halfling",
};

const raceTraits: Readonly<Record<Race, readonly string[]>> = {
  human: [],
  dwarf: ["Infravision 60'"],
  elf: ["Keen senses", "Harmed by iron"],
  halfling: ["Infravision 30'"],
};

export function rollRace(dice: Dice, chance: number): Race {
  if (chance <= 0) return "human";
  if (chance < demihumanChanceSides && dice.roll(demihumanChanceSides) > chance) return "human";
  return demihumanRaces[dice.roll(demihumanRaces.length) - 1] as Race;
}

export function baseSpeed(race: Race): number {
  return baseSpeeds[race];
}

export function racialLanguage(race: Race): RacialLanguage | null {
  return racialLanguages[race];
}

export function traitsFor(race: Race): string[] {
  return [...raceTraits[race]];
}

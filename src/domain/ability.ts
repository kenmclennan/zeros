import { abilityModifierTable } from "./tables/ability-modifiers.js";

export const abilityNames = [
  "strength",
  "agility",
  "stamina",
  "personality",
  "intelligence",
  "luck",
] as const;

export type AbilityName = (typeof abilityNames)[number];

export interface AbilityScore {
  score: number;
  modifier: number;
}

export function abilityModifier(score: number): number {
  const modifier = abilityModifierTable[score];
  if (modifier === undefined) {
    throw new RangeError(`ability score ${score} is outside 3..18`);
  }
  return modifier;
}

import type { Dice } from "./ports/dice.js";
import { equipmentTable } from "./tables/equipment.js";

export type Alignment = "lawful" | "neutral" | "chaotic";

const equipmentSides = 24;
const moneyDice = 5;
const moneySides = 12;
const alignmentSides = 6;

export function lookupEquipment(roll: number): string {
  const item = equipmentTable[roll - 1];
  if (item === undefined) throw new RangeError(`no equipment for roll ${roll}`);
  return item;
}

export function rollEquipmentRow(dice: Dice): number {
  return dice.roll(equipmentSides);
}

export function rollCopper(dice: Dice): number {
  let copper = 0;
  for (let i = 0; i < moneyDice; i++) copper += dice.roll(moneySides);
  return copper;
}

export function alignmentFor(roll: number): Alignment {
  if (roll <= 2) return "lawful";
  if (roll <= 4) return "neutral";
  return "chaotic";
}

export function rollAlignment(dice: Dice): Alignment {
  return alignmentFor(dice.roll(alignmentSides));
}

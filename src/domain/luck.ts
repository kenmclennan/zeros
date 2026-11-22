import { type Augur, augurTable, type LuckTarget } from "./tables/lucky-roll.js";

export interface LuckyRoll {
  roll: number;
  text: string;
  modifier: number;
  appliesTo: LuckTarget | null;
}

export type SheetNumber =
  | "melee"
  | "missile"
  | "reflex"
  | "fortitude"
  | "will"
  | "armorClass"
  | "initiative"
  | "hitPoints"
  | "extraLanguages"
  | "speed";

const targetFields: Readonly<Record<LuckTarget, readonly SheetNumber[]>> = {
  "all-attacks": ["melee", "missile"],
  melee: ["melee"],
  missile: ["missile"],
  "all-saves": ["reflex", "fortitude", "will"],
  reflex: ["reflex"],
  fortitude: ["fortitude"],
  will: ["will"],
  armorClass: ["armorClass"],
  initiative: ["initiative"],
  hitPoints: ["hitPoints"],
  extraLanguages: ["extraLanguages"],
  speed: ["speed"],
};

const feetPerSpeedPoint = 5;

export function lookupAugur(roll: number): Augur {
  const augur = augurTable[roll - 1];
  if (augur === undefined) {
    throw new RangeError(`lucky roll ${roll} is outside 1..30`);
  }
  return augur;
}

export function makeLuckyRoll(roll: number, modifier: number): LuckyRoll {
  const augur = lookupAugur(roll);
  return { roll, text: augur.text, modifier, appliesTo: augur.appliesTo };
}

export function luckBonus(luckyRoll: LuckyRoll, field: SheetNumber): number {
  if (luckyRoll.appliesTo === null) return 0;
  if (!targetFields[luckyRoll.appliesTo].includes(field)) return 0;
  return field === "speed" ? luckyRoll.modifier * feetPerSpeedPoint : luckyRoll.modifier;
}

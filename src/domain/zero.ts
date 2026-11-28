import { type AbilityName, type AbilityScore, abilityModifier, abilityNames } from "./ability.js";
import { type Feature, rollFeatures } from "./description.js";
import {
  type Alignment,
  lookupEquipment,
  rollAlignment,
  rollCopper,
  rollEquipmentRow,
} from "./gear.js";
import { type LuckyRoll, luckBonus, makeLuckyRoll } from "./luck.js";
import { rollName, rollSex, type Sex, type ZeroName } from "./name.js";
import { expandTradeGoods, type Occupation, rollOccupation } from "./occupation.js";
import type { Dice } from "./ports/dice.js";
import {
  baseSpeed,
  type Race,
  type RacialLanguage,
  racialLanguage,
  rollRace,
  traitsFor,
} from "./race.js";

export interface Zero {
  abilities: Record<AbilityName, AbilityScore>;
  luckyRoll: LuckyRoll;
  hitPoints: number;
  saves: { reflex: number; fortitude: number; will: number };
  initiative: number;
  armorClass: number;
  speed: number;
  attack: { melee: number; missile: number };
  crit: { die: 4; table: "I" };
  languages: {
    common: true;
    racial: RacialLanguage | null;
    extraLanguages: number;
    canReadAndWrite: boolean;
  };
  experience: number;
  race: Race;
  traits: string[];
  occupation: Occupation;
  equipment: string;
  money: { copper: number };
  alignment: Alignment;
  sex: Sex;
  name: ZeroName;
  features: Feature[];
}

export interface RollOptions {
  alignment?: Alignment;
  heroicChance?: number;
  survivors?: boolean;
  demihumanChance?: number;
}

const abilityDiceCount = 3;
const abilityDieSides = 6;
const luckyRollSides = 30;
const hitDieSides = 4;
const heroicChanceSides = 100;
const baseArmorClass = 10;
const minimumHitPoints = 1;
const commonOnlyIntelligence = 7;
const cannotReadIntelligence = 5;

function rollAbility(dice: Dice, heroic: boolean): AbilityScore {
  const rolls: number[] = [];
  const diceCount = heroic ? abilityDiceCount + 1 : abilityDiceCount;
  for (let i = 0; i < diceCount; i++) rolls.push(dice.roll(abilityDieSides));
  rolls.sort((a, b) => b - a);
  const score = rolls.slice(0, abilityDiceCount).reduce((sum, die) => sum + die, 0);
  return { score, modifier: abilityModifier(score) };
}

function rollHeroic(dice: Dice, chance: number): boolean {
  if (chance <= 0) return false;
  if (chance >= heroicChanceSides) return true;
  return dice.roll(heroicChanceSides) <= chance;
}

export function rollZero(dice: Dice, options: RollOptions = {}): Zero {
  const heroic = rollHeroic(dice, options.heroicChance ?? 0);
  const rolled = {} as Record<AbilityName, AbilityScore>;
  for (const name of abilityNames) rolled[name] = rollAbility(dice, heroic);

  const luckyRoll = makeLuckyRoll(dice.roll(luckyRollSides), rolled.luck.modifier);
  let hitDie = dice.roll(hitDieSides);
  if (options.survivors === true) hitDie = Math.max(hitDie, dice.roll(hitDieSides));

  const occupation = rollOccupation(dice);
  const race = rollRace(dice, options.demihumanChance ?? 0);
  const equipment = lookupEquipment(rollEquipmentRow(dice));
  const copper = rollCopper(dice);
  const alignment = options.alignment ?? rollAlignment(dice);
  const sex = rollSex(dice);
  const name = rollName(dice, sex);
  const tradeGoods = expandTradeGoods(occupation.tradeGoods, dice);
  const features = rollFeatures(dice, sex, rolled);

  const bonus = (field: Parameters<typeof luckBonus>[1]) => luckBonus(luckyRoll, field);

  const intelligence = rolled.intelligence;
  const extraLanguages =
    intelligence.score <= commonOnlyIntelligence
      ? 0
      : Math.max(0, intelligence.modifier + bonus("extraLanguages"));

  return {
    abilities: rolled,
    luckyRoll,
    hitPoints: Math.max(minimumHitPoints, hitDie + rolled.stamina.modifier + bonus("hitPoints")),
    saves: {
      reflex: rolled.agility.modifier + bonus("reflex"),
      fortitude: rolled.stamina.modifier + bonus("fortitude"),
      will: rolled.personality.modifier + bonus("will"),
    },
    initiative: rolled.agility.modifier + bonus("initiative"),
    armorClass: baseArmorClass + rolled.agility.modifier + bonus("armorClass"),
    speed: baseSpeed(race) + bonus("speed"),
    attack: {
      melee: rolled.strength.modifier + bonus("melee"),
      missile: rolled.agility.modifier + bonus("missile"),
    },
    crit: { die: 4, table: "I" },
    languages: {
      common: true,
      racial: racialLanguage(race),
      extraLanguages,
      canReadAndWrite: intelligence.score > cannotReadIntelligence,
    },
    experience: 0,
    race,
    traits: traitsFor(race),
    occupation: { ...occupation, tradeGoods },
    equipment,
    money: { copper },
    alignment,
    sex,
    name,
    features,
  };
}

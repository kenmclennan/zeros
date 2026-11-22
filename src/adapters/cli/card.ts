import { abilityNames, type Zero } from "../../domain/index.js";
import {
  capitalise,
  featureText,
  languages,
  luckyRollText,
  signed,
  weaponText,
} from "./wording.js";

const labels: Record<(typeof abilityNames)[number], string> = {
  strength: "STR",
  agility: "AGI",
  stamina: "STA",
  personality: "PER",
  intelligence: "INT",
  luck: "LCK",
};

const scoreWidth = 2;

function abilityCell(zero: Zero, name: (typeof abilityNames)[number]): string {
  const ability = zero.abilities[name];
  return `${labels[name]} ${String(ability.score).padStart(scoreWidth)} (${signed(ability.modifier)})`;
}

export function renderCard(zero: Zero): string {
  const [str, agi, sta, per, int, lck] = abilityNames.map((name) => abilityCell(zero, name));
  const { occupation } = zero;
  return [
    `${zero.name.display} - ${zero.sex}, ${capitalise(zero.alignment)} ${occupation.name}`,
    `Features: ${featureText(zero)}`,
    `${str}  ${agi}  ${sta}`,
    `${per}  ${int}  ${lck}`,
    `HP ${zero.hitPoints}  AC ${zero.armorClass}  Init ${signed(zero.initiative)}  Speed ${zero.speed}`,
    `Attack: melee ${signed(zero.attack.melee)}, missile ${signed(zero.attack.missile)}`,
    `Saves: Ref ${signed(zero.saves.reflex)}  Fort ${signed(zero.saves.fortitude)}  Will ${signed(zero.saves.will)}`,
    `Lucky roll: ${luckyRollText(zero)}`,
    `Weapon: ${weaponText(zero)}`,
    `Trade goods: ${occupation.tradeGoods}`,
    `Equipment: ${zero.equipment}`,
    `Copper: ${zero.money.copper}`,
    `Languages: ${languages(zero)}`,
    `XP: ${zero.experience}`,
  ].join("\n");
}

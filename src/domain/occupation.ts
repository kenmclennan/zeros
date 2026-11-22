import type { Dice } from "./ports/dice.js";
import { occupationTable } from "./tables/occupations.js";
import { weaponTable } from "./tables/weapons.js";

export interface Occupation {
  name: string;
  weapon: { written: string; fightsAs: string; damage: string };
  tradeGoods: string;
}

const occupationSides = 100;
const whipDamage = "1d3";
const diceTerm = /(\d+)d(\d+)( \w+s\b)?/g;

export function weaponDamage(fightsAs: string): string {
  if (fightsAs === "Whip") return whipDamage;
  const row = weaponTable.find((weapon) => weapon.name === fightsAs);
  if (!row) throw new Error(`no Table 3-1 weapon named ${fightsAs}`);
  return row.damage;
}

export function lookupOccupation(roll: number): Occupation {
  const row = occupationTable.find((entry) => roll >= entry.from && roll <= entry.to);
  if (!row) throw new RangeError(`no occupation for roll ${roll}`);
  return {
    name: row.name,
    weapon: { written: row.weapon, fightsAs: row.fightsAs, damage: weaponDamage(row.fightsAs) },
    tradeGoods: row.tradeGoods,
  };
}

export function rollOccupationRow(dice: Dice): number {
  return dice.roll(occupationSides);
}

export function expandTradeGoods(tradeGoods: string, dice: Dice): string {
  return tradeGoods.replace(
    diceTerm,
    (_term, count: string, sides: string, plural: string | undefined) => {
      let total = 0;
      for (let i = 0; i < Number(count); i++) total += dice.roll(Number(sides));
      if (plural === undefined) return String(total);
      return total === 1 ? `1${plural.slice(0, -1)}` : `${total}${plural}`;
    },
  );
}

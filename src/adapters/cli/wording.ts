import type { Zero } from "../../domain/index.js";

export function signed(value: number): string {
  return value < 0 ? `-${Math.abs(value)}` : `+${value}`;
}

export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function languages(zero: Zero): string {
  const { racial, extraLanguages, canReadAndWrite } = zero.languages;
  const extra = extraLanguages > 0 ? ` +${extraLanguages} extra` : "";
  const literacy = canReadAndWrite ? "(reads and writes)" : "(cannot read or write)";
  const racialPart = racial === null ? "" : `, ${racial}`;
  return `Common${racialPart}${extra} ${literacy}`;
}

export function featureText(zero: Zero): string {
  return zero.features.map((entry) => entry.feature).join("; ");
}

export function luckyRollText(zero: Zero): string {
  const { roll, modifier, text } = zero.luckyRoll;
  return `${roll} (${signed(modifier)}) ${text}`;
}

export function weaponText(zero: Zero): string {
  return `${zero.occupation.weapon.written}, ${zero.occupation.weapon.damage}`;
}

const racePrefixes: Readonly<Record<Zero["race"], string>> = {
  human: "",
  dwarf: "Dwarven ",
  elf: "Elven ",
  halfling: "Halfling ",
};

export function occupationTitle(zero: Zero): string {
  return `${racePrefixes[zero.race]}${zero.occupation.name}`;
}

export function traitsText(zero: Zero): string {
  return zero.traits.join("; ");
}

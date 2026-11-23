import { describe, expect, it } from "vitest";
import { augurTable, rollZero, type Zero } from "../src/domain/index.js";
import { script, scriptedDice } from "./helpers.js";

const texts = [
  "Born in the year of the black frost: All attack rolls",
  "Sign of the war-ox: Melee attack rolls",
  "Born beneath the archer's moon: Missile fire attack rolls",
  "Suckled by a she-wolf: Unarmed attack rolls",
  "Born in a raider's saddle: Mounted attack rolls",
  "Born amid the slaughter: Damage rolls",
  "Blood of the cave-bear: Melee damage rolls",
  "Eyes of the desert falcon: Missile fire damage rolls",
  "Hunted with the jackals: Attack and damage rolls for 0-level starting weapon",
  "Apprenticed in the bazaar: Skill checks (including thief skills)",
  "Raised among tomb-robbers: Find/disable traps",
  "Born in a smuggler's tunnel: Find secret doors",
  "Seventh child of a witch: Spellcasting rolls",
  "Born as the sorcerer's tower burned: Spell damage",
  "Blessed at a forgotten altar: Drive back the defiler checks",
  "Lived through the red plague: Magical healing",
  "Born under the serpent star: Saving throws",
  "Watched by an ancestor's ghost: Saving throws to escape traps",
  "Stung by the scorpion and lived: Saving throws against poison",
  "Touched by the storm-god's lash: Reflex saving throws",
  "Survived the long siege: Fortitude saving throws",
  "Refused the demon's bargain: Willpower saving throws",
  "Wears a mother's amulet: Armor Class",
  "Swift as the striking asp: Initiative",
  "Fed on lion's meat: Hit points (applies at each level)",
  "Kin to the headsman: Critical hit tables",
  "Born in a haunted ruin: Rolls against sorcery's taint",
  "Cursed by a dying priest: Fumbles",
  "Raised in a caravanserai: Number of languages",
  "Ran with the wild horses: Speed (each +1/-1 = +5'/-5' speed)",
];

const appliesTo: Record<number, string> = {
  1: "all-attacks",
  2: "melee",
  3: "missile",
  17: "all-saves",
  20: "reflex",
  21: "fortitude",
  22: "will",
  23: "armorClass",
  24: "initiative",
  25: "hitPoints",
  29: "extraLanguages",
  30: "speed",
};

const changedFields: Record<number, string[]> = {
  1: ["attack.melee", "attack.missile"],
  2: ["attack.melee"],
  3: ["attack.missile"],
  17: ["saves.reflex", "saves.fortitude", "saves.will"],
  20: ["saves.reflex"],
  21: ["saves.fortitude"],
  22: ["saves.will"],
  23: ["armorClass"],
  24: ["initiative"],
  25: ["hitPoints"],
  29: ["languages.extraLanguages"],
  30: ["speed"],
};

const base = { strength: 10, agility: 10, stamina: 10, intelligence: 10 };

function flatten(
  zero: Zero,
  prefix = "",
  out: Record<string, unknown> = {},
): Record<string, unknown> {
  for (const [key, value] of Object.entries(zero)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") flatten(value as unknown as Zero, path, out);
    else out[path] = value;
  }
  return out;
}

describe("Table 1-2", () => {
  it("carries thirty augurs in roll order", () => {
    expect(augurTable.map((a) => a.roll)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it("all thirty augurs", () => {
    const problems: string[] = [];
    for (let roll = 1; roll <= 30; roll++) {
      const baseline = rollZero(scriptedDice(script({ ...base, luck: 9 }, roll, 2)));
      const lucky = rollZero(scriptedDice(script({ ...base, luck: 18 }, roll, 2)));
      expect(lucky.luckyRoll.text, `text ${roll}`).toBe(texts[roll - 1]);
      expect(lucky.luckyRoll.appliesTo, `appliesTo ${roll}`).toBe(appliesTo[roll] ?? null);
      expect(lucky.luckyRoll.modifier).toBe(3);

      const before = flatten(baseline);
      const after = flatten(lucky);
      const differing = Object.keys(after).filter(
        (key) =>
          !key.startsWith("abilities.luck") &&
          !key.startsWith("luckyRoll") &&
          before[key] !== after[key],
      );
      const wanted = changedFields[roll] ?? [];
      if (differing.sort().join() !== [...wanted].sort().join()) {
        problems.push(
          `roll ${roll}: changed ${differing.join(",") || "nothing"}, expected ${wanted.join(",") || "nothing"}`,
        );
        continue;
      }
      for (const key of wanted) {
        const delta = key === "speed" ? 15 : 3;
        if ((after[key] as number) - (before[key] as number) !== delta) {
          problems.push(
            `roll ${roll}: ${key} moved by ${(after[key] as number) - (before[key] as number)}`,
          );
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("records the modifier but changes nothing for a record-only augur", () => {
    const zero = rollZero(scriptedDice(script({ ...base, luck: 18 }, 6, 2)));
    expect(zero.luckyRoll).toEqual({ roll: 6, text: texts[5], modifier: 3, appliesTo: null });
  });

  it("records modifier 0 at Luck 9-12", () => {
    const zero = rollZero(scriptedDice(script({ ...base, luck: 12 }, 23, 2)));
    expect(zero.luckyRoll.modifier).toBe(0);
    expect(zero.armorClass).toBe(10);
  });

  it("applies a negative Luck modifier", () => {
    const ac = rollZero(scriptedDice(script({ ...base, agility: 10, luck: 3 }, 23, 2)));
    expect(ac.armorClass).toBe(10 + 0 - 3);
    const speed = rollZero(scriptedDice(script({ ...base, luck: 3 }, 30, 2)));
    expect(speed.speed).toBe(15);
  });

  it("raises speed by 5 per point of positive modifier", () => {
    const zero = rollZero(scriptedDice(script({ ...base, luck: 18 }, 30, 2)));
    expect(zero.speed).toBe(45);
  });
});

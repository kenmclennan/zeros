export type LuckTarget =
  | "all-attacks"
  | "melee"
  | "missile"
  | "all-saves"
  | "reflex"
  | "fortitude"
  | "will"
  | "armorClass"
  | "initiative"
  | "hitPoints"
  | "extraLanguages"
  | "speed";

export interface Augur {
  roll: number;
  text: string;
  appliesTo: LuckTarget | null;
}

export const augurTable: readonly Augur[] = [
  {
    roll: 1,
    text: "Born in the year of the black frost: All attack rolls",
    appliesTo: "all-attacks",
  },
  { roll: 2, text: "Sign of the war-ox: Melee attack rolls", appliesTo: "melee" },
  {
    roll: 3,
    text: "Born beneath the archer's moon: Missile fire attack rolls",
    appliesTo: "missile",
  },
  { roll: 4, text: "Suckled by a she-wolf: Unarmed attack rolls", appliesTo: null },
  { roll: 5, text: "Born in a raider's saddle: Mounted attack rolls", appliesTo: null },
  { roll: 6, text: "Born amid the slaughter: Damage rolls", appliesTo: null },
  { roll: 7, text: "Blood of the cave-bear: Melee damage rolls", appliesTo: null },
  { roll: 8, text: "Eyes of the desert falcon: Missile fire damage rolls", appliesTo: null },
  {
    roll: 9,
    text: "Hunted with the jackals: Attack and damage rolls for 0-level starting weapon",
    appliesTo: null,
  },
  {
    roll: 10,
    text: "Apprenticed in the bazaar: Skill checks (including thief skills)",
    appliesTo: null,
  },
  { roll: 11, text: "Raised among tomb-robbers: Find/disable traps", appliesTo: null },
  { roll: 12, text: "Born in a smuggler's tunnel: Find secret doors", appliesTo: null },
  { roll: 13, text: "Seventh child of a witch: Spellcasting rolls", appliesTo: null },
  { roll: 14, text: "Born as the sorcerer's tower burned: Spell damage", appliesTo: null },
  { roll: 15, text: "Blessed at a forgotten altar: Turn unholy checks", appliesTo: null },
  { roll: 16, text: "Lived through the red plague: Magical healing", appliesTo: null },
  { roll: 17, text: "Born under the serpent star: Saving throws", appliesTo: "all-saves" },
  {
    roll: 18,
    text: "Watched by an ancestor's ghost: Saving throws to escape traps",
    appliesTo: null,
  },
  {
    roll: 19,
    text: "Stung by the scorpion and lived: Saving throws against poison",
    appliesTo: null,
  },
  { roll: 20, text: "Touched by the storm-god's lash: Reflex saving throws", appliesTo: "reflex" },
  { roll: 21, text: "Survived the long siege: Fortitude saving throws", appliesTo: "fortitude" },
  { roll: 22, text: "Refused the demon's bargain: Willpower saving throws", appliesTo: "will" },
  { roll: 23, text: "Wears a mother's amulet: Armor Class", appliesTo: "armorClass" },
  { roll: 24, text: "Swift as the striking asp: Initiative", appliesTo: "initiative" },
  {
    roll: 25,
    text: "Fed on lion's meat: Hit points (applies at each level)",
    appliesTo: "hitPoints",
  },
  { roll: 26, text: "Kin to the headsman: Critical hit tables", appliesTo: null },
  { roll: 27, text: "Born in a haunted ruin: Rolls against sorcery's taint", appliesTo: null },
  { roll: 28, text: "Cursed by a dying priest: Fumbles", appliesTo: null },
  { roll: 29, text: "Raised in a caravanserai: Number of languages", appliesTo: "extraLanguages" },
  {
    roll: 30,
    text: "Ran with the wild horses: Speed (each +1/-1 = +5'/-5' speed)",
    appliesTo: "speed",
  },
];

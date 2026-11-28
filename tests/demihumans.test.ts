import { describe, expect, it } from "vitest";
import { parseCli } from "../src/adapters/cli/args.js";
import { renderCard } from "../src/adapters/cli/card.js";
import { run } from "../src/adapters/cli/run.js";
import { blankSheet, renderSheet } from "../src/adapters/cli/sheet.js";
import { createSeededDice } from "../src/adapters/seeded-dice.js";
import { rollZero, type Zero } from "../src/domain/index.js";
import { defaultTail, script, scriptedDice } from "./helpers.js";

const afterOccupation = 1;

function withRaceRolls(raceRolls: number[], augur = 6): number[] {
  const tail = [
    ...defaultTail.slice(0, afterOccupation),
    ...raceRolls,
    ...defaultTail.slice(afterOccupation),
  ];
  return script({}, augur, 2, tail);
}

function rollWith(raceRolls: number[], chance: number, augur = 6) {
  const values = withRaceRolls(raceRolls, augur);
  const dice = scriptedDice(values);
  const zero = rollZero(dice, { demihumanChance: chance });
  return { zero, dice, total: values.length };
}

function runCli(...argv: string[]) {
  let out = "";
  const code = run(argv, {
    stdout: (t) => {
      out += t;
    },
    stderr: () => {},
    randomSeed: () => 7,
  });
  expect(code).toBe(0);
  return out;
}

function raceOf(race: number): Zero {
  return rollWith([race], 100).zero;
}

describe("--demihumans parsing", () => {
  const message = "--demihumans needs a percentage from 1 to 100";

  it("accepts a percentage with a space or an equals sign", () => {
    expect(parseCli(["roll", "--demihumans", "25"])).toMatchObject({ demihumanChance: 25 });
    expect(parseCli(["roll", "--demihumans=25"])).toMatchObject({ demihumanChance: 25 });
    expect(parseCli(["roll", "--demihumans", "100"])).toMatchObject({ demihumanChance: 100 });
  });

  it("defaults to 0", () => {
    expect(parseCli(["roll"])).toMatchObject({ kind: "roll", demihumanChance: 0 });
  });

  it.each([
    [["roll", "--demihumans"]],
    [["roll", "--demihumans", "--survivors"]],
    [["roll", "--demihumans", "abc"]],
    [["roll", "--demihumans", "2.5"]],
    [["roll", "--demihumans", "0"]],
    [["roll", "--demihumans", "101"]],
    [["roll", "--demihumans="]],
    [["roll", "--demihumans=0"]],
    [["roll", "--demihumans=-3"]],
  ])("rejects %j", (argv) => {
    expect(parseCli(argv)).toEqual({ kind: "error", message });
  });
});

describe("demihuman gate", () => {
  it("makes a zero a demihuman when the d100 is at the chance", () => {
    const { zero, dice, total } = rollWith([30, 2], 30);
    expect(zero.race).toBe("elf");
    expect(dice.consumed()).toBe(total);
  });

  it("keeps a zero human when the d100 is one above the chance", () => {
    const { zero, dice, total } = rollWith([31], 30);
    expect(zero.race).toBe("human");
    expect(dice.consumed()).toBe(total);
  });

  it("rolls the gate directly after the occupation and before equipment", () => {
    const { dice } = rollWith([10, 1], 50);
    expect(dice.sidesAsked.slice(20, 24)).toEqual([79, 100, 3, 24]);
  });

  it.each([
    [1, "dwarf"],
    [2, "elf"],
    [3, "halfling"],
  ])("maps the d3 roll %i to %s", (roll, race) => {
    const { zero, dice, total } = rollWith([10, roll], 50);
    expect(zero.race).toBe(race);
    expect(dice.consumed()).toBe(total);
  });

  it("adds no dice at chance 0 or without the option", () => {
    const values = script({}, 6, 2);
    for (const options of [{ demihumanChance: 0 }, {}]) {
      const dice = scriptedDice(values);
      const zero = rollZero(dice, options);
      expect(zero.race).toBe("human");
      expect(dice.consumed()).toBe(values.length);
    }
  });

  it("skips the gate at 100 and rolls only the d3", () => {
    const { zero, dice, total } = rollWith([3], 100);
    expect(zero.race).toBe("halfling");
    expect(dice.consumed()).toBe(total);
    expect(dice.sidesAsked.slice(20, 23)).toEqual([79, 3, 24]);
  });

  it("leaves every existing seed unchanged without the option", () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(rollZero(createSeededDice(seed), { demihumanChance: 0 })).toEqual(
        rollZero(createSeededDice(seed)),
      );
      expect(rollZero(createSeededDice(seed)).race).toBe("human");
    }
  });
});

describe("race traits", () => {
  it.each([
    ["dwarf", 1, 20, "Dwarvish", ["Infravision 60'"]],
    ["elf", 2, 30, "Elvish", ["Keen senses", "Harmed by iron"]],
    ["halfling", 3, 20, "Halfling", ["Infravision 30'"]],
  ])("%s: speed, language and traits", (race, roll, speed, language, traits) => {
    const zero = raceOf(roll);
    expect(zero.race).toBe(race);
    expect(zero.speed).toBe(speed);
    expect(zero.languages.racial).toBe(language);
    expect(zero.traits).toEqual(traits);
  });

  it("gives a human 30 speed, no racial language and no traits", () => {
    const zero = rollZero(scriptedDice(script({}, 6, 2)));
    expect(zero).toMatchObject({ race: "human", speed: 30, traits: [] });
    expect(zero.languages.racial).toBeNull();
  });

  it("still applies the lucky-roll speed bonus on top of the racial base", () => {
    const values = script({ luck: 18 }, 30, 2, [
      defaultTail[0] as number,
      1,
      ...defaultTail.slice(1),
    ]);
    const dwarf = rollZero(scriptedDice(values), { demihumanChance: 100 });
    expect(dwarf.luckyRoll.appliesTo).toBe("speed");
    expect(dwarf.luckyRoll.modifier).toBe(3);
    expect(dwarf.speed).toBe(35);
  });
});

describe("demihuman rendering", () => {
  const dwarf = raceOf(1);
  const elf = raceOf(2);
  const halfling = raceOf(3);
  const human = rollZero(scriptedDice(script({}, 6, 2)));

  it("prefixes the occupation and names the race on the card", () => {
    const first = (zero: Zero) => renderCard(zero).split("\n")[0];
    expect(first(dwarf)).toMatch(/ - [a-z]+ dwarf, [A-Z][a-z]+ Dwarven /);
    expect(first(elf)).toMatch(/ - [a-z]+ elf, [A-Z][a-z]+ Elven /);
    expect(first(halfling)).toMatch(/ - [a-z]+ halfling, [A-Z][a-z]+ Halfling /);
    expect(first(human)).toMatch(/ - [a-z]+, [A-Z][a-z]+ /);
    expect(first(human)).not.toMatch(/human/);
  });

  it("shows the racial language and a Traits line on a demihuman card", () => {
    const lines = renderCard(elf).split("\n");
    const languages = lines.findIndex((line) => line.startsWith("Languages: "));
    expect(lines[languages]).toBe("Languages: Common, Elvish (reads and writes)");
    expect(lines[languages + 1]).toBe("Traits: Keen senses; Harmed by iron");
    expect(renderCard(human)).not.toContain("Traits:");
  });

  it("puts the racial language before the extra-language count", () => {
    const smart = rollZero(scriptedDice(withRaceRolls([1], 6)), {
      demihumanChance: 100,
    });
    const text = renderCard({
      ...smart,
      languages: { ...smart.languages, extraLanguages: 2 },
    });
    expect(text).toContain("Languages: Common, Dwarvish +2 extra (reads and writes)");
  });

  it("shows race, prefixed occupation, languages and traits on the sheet", () => {
    const lines = renderSheet(halfling).split("\n");
    expect(lines[2]).toMatch(/^\| [A-Z][a-z]+ halfling, [A-Z][a-z]+ +Halfling /);
    const languages = lines.findIndex((line) => line.startsWith("| LANGUAGES"));
    expect(lines[languages]).toMatch(/^\| LANGUAGES {2}Common, Halfling \(reads and writes\) +\|$/);
    expect(lines[languages + 1]).toBe(`| ${"TRAITS     Infravision 30'".padEnd(60)} |`);
    expect(renderSheet(human).split("\n")[2]).toMatch(/^\| [A-Z][a-z]+ human, [A-Z][a-z]+ +\S/);
    expect(renderSheet(human)).not.toContain("TRAITS");
  });

  it("joins traits with semicolons on the sheet", () => {
    expect(renderSheet(elf)).toContain("| TRAITS     Keen senses; Harmed by iron");
  });

  it("adds an empty TRAITS row under LANGUAGES on the blank sheet", () => {
    const lines = blankSheet.split("\n");
    const languages = lines.findIndex((line) => line.startsWith("| LANGUAGES"));
    expect(lines[languages + 1]).toBe(`| ${"TRAITS".padEnd(60)} |`);
  });

  it("keeps every sheet line at 64 characters", () => {
    const sheets = [human, dwarf, elf, halfling].map(renderSheet).concat(blankSheet);
    for (const sheet of sheets) {
      for (const line of sheet.split("\n")) expect(line).toHaveLength(64);
    }
    const fourUp = runCli("roll", "--count", "5", "--demihumans", "60", "--format", "ascii");
    for (const line of fourUp.split("\n").slice(2)) expect(line.length).toBeLessThanOrEqual(64);
    const grid = runCli(
      "roll",
      "--count",
      "5",
      "--demihumans",
      "60",
      "--format",
      "ascii",
      "--layout",
      "4-up",
    );
    for (const line of grid.split("\n").slice(2)) expect(line.length).toBeLessThanOrEqual(130);
  });

  it("moves a too-long occupation to its own line", () => {
    const long: Zero = {
      ...dwarf,
      occupation: { ...dwarf.occupation, name: "Extremely Elaborate Wandering Cartographer" },
    };
    const lines = renderSheet(long).split("\n");
    expect(lines[3]).toMatch(/Dwarven Extremely Elaborate Wandering Cartographer \|$/);
    for (const line of lines) expect(line).toHaveLength(64);
  });
});

describe("demihuman output", () => {
  it("shows the setting in the headers", () => {
    for (const format of ["text", "ascii"]) {
      const head = (...flags: string[]) =>
        runCli("roll", "--format", format, ...flags).split("\n")[0];
      expect(head("--demihumans", "25")).toBe("Seed: 7 (demihumans 25%)");
      expect(head("--heroic", "50", "--survivors", "--demihumans", "25")).toBe(
        "Seed: 7 (heroic 50%, survivors, demihumans 25%)",
      );
      expect(head()).toBe("Seed: 7");
    }
  });

  it("puts demihumanChance after survivors in the JSON and carries race fields", () => {
    const out = JSON.parse(runCli("roll", "--demihumans", "100", "--format", "json"));
    expect(Object.keys(out)).toEqual([
      "seed",
      "heroic",
      "heroicChance",
      "survivors",
      "demihumanChance",
      "zeros",
    ]);
    expect(out.demihumanChance).toBe(100);
    const [zero] = out.zeros;
    expect(["dwarf", "elf", "halfling"]).toContain(zero.race);
    expect(zero.traits.length).toBeGreaterThan(0);
    expect(zero.languages.racial).not.toBeNull();
    expect(JSON.parse(runCli("roll", "--format", "json")).demihumanChance).toBe(0);
  });

  it("splits 3,000 seeded zeros at 30% into plausible shares", () => {
    const counts = { human: 0, dwarf: 0, elf: 0, halfling: 0 };
    const dice = createSeededDice(2024);
    for (let i = 0; i < 3000; i++) counts[rollZero(dice, { demihumanChance: 30 }).race]++;
    const demihumans = counts.dwarf + counts.elf + counts.halfling;
    expect(demihumans / 3000).toBeGreaterThanOrEqual(0.25);
    expect(demihumans / 3000).toBeLessThanOrEqual(0.35);
    for (const race of ["dwarf", "elf", "halfling"] as const) {
      expect(counts[race] / demihumans).toBeGreaterThanOrEqual(0.25);
      expect(counts[race] / demihumans).toBeLessThanOrEqual(0.42);
    }
  });
});

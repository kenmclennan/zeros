import { describe, expect, it } from "vitest";
import { parseCli } from "../src/adapters/cli/args.js";
import { run } from "../src/adapters/cli/run.js";
import { createSeededDice } from "../src/adapters/seeded-dice.js";
import { abilityNames, type Dice, rollZero } from "../src/domain/index.js";
import { defaultTail, descriptionRolls, scriptedDice } from "./helpers.js";

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

function recordingDice(seed: number) {
  const inner = createSeededDice(seed);
  const sides: number[] = [];
  const dice: Dice = {
    roll(n: number): number {
      sides.push(n);
      return inner.roll(n);
    },
  };
  return { dice, sides };
}

describe("heroic", () => {
  it("parses --heroic and defaults it off", () => {
    expect(parseCli(["roll", "--heroic"])).toMatchObject({ kind: "roll", heroicChance: 100 });
    expect(parseCli(["roll"])).toMatchObject({ kind: "roll", heroicChance: 0 });
  });

  it("sums the highest three of four dice", () => {
    const dice = scriptedDice([
      1,
      4,
      5,
      6,
      ...Array(5 * 4).fill(1),
      1,
      1,
      ...defaultTail,
      ...descriptionRolls,
    ]);
    const zero = rollZero(dice, { heroicChance: 100 });
    expect(zero.abilities.strength.score).toBe(15);
    expect(dice.sidesAsked.slice(0, 24).every((s) => s === 6)).toBe(true);
  });

  it("keeps every heroic ability within 3-18", () => {
    for (let seed = 0; seed < 200; seed++) {
      const zero = rollZero(createSeededDice(seed), { heroicChance: 100 });
      for (const name of abilityNames) {
        expect(zero.abilities[name].score).toBeGreaterThanOrEqual(3);
        expect(zero.abilities[name].score).toBeLessThanOrEqual(18);
      }
    }
  });

  it("leaves a non-heroic roll unchanged", () => {
    expect(rollZero(createSeededDice(1), { heroicChance: 0 })).toEqual(
      rollZero(createSeededDice(1)),
    );
  });

  it("shows the mode in the header", () => {
    expect(runCli("roll", "--heroic").startsWith("Seed: 7 (heroic)\n")).toBe(true);
    expect(runCli("roll").startsWith("Seed: 7\n")).toBe(true);
  });

  it("shows the mode in the json", () => {
    expect(JSON.parse(runCli("roll", "--heroic", "--format", "json")).heroic).toBe(true);
    expect(JSON.parse(runCli("roll", "--format", "json")).heroic).toBe(false);
  });

  it("parses bare, spaced and equals forms", () => {
    expect(parseCli(["roll", "--heroic", "50"])).toMatchObject({ kind: "roll", heroicChance: 50 });
    expect(parseCli(["roll", "--heroic=50"])).toMatchObject({ kind: "roll", heroicChance: 50 });
    expect(parseCli(["--heroic", "25", "roll", "--count", "2"])).toMatchObject({
      kind: "roll",
      heroicChance: 25,
      count: 2,
    });
  });

  it("rejects a chance outside 1-100 or not an integer", () => {
    for (const bad of [
      ["--heroic", "0"],
      ["--heroic", "101"],
      ["--heroic=0"],
      ["--heroic=abc"],
      ["--heroic=2.5"],
    ]) {
      expect(parseCli(["roll", ...bad])).toEqual({
        kind: "error",
        message: "--heroic must be an integer from 1 to 100",
      });
    }
  });

  it("rolls chance 100 as four dice with no gate roll and absent as the old 3d6 roll", () => {
    for (let seed = 0; seed < 20; seed++) {
      const recorder = recordingDice(seed);
      rollZero(recorder.dice, { heroicChance: 100 });
      expect(recorder.sides.slice(0, 25).filter((s) => s === 6)).toHaveLength(24);
      expect(recorder.sides[24]).toBe(30);
      expect(rollZero(createSeededDice(seed), { heroicChance: 0 })).toEqual(
        rollZero(createSeededDice(seed)),
      );
    }
  });

  it("gates the method on a d100 roll at 1-99", () => {
    const at = scriptedDice([
      50,
      1,
      4,
      5,
      6,
      ...Array(5 * 4).fill(1),
      1,
      1,
      ...defaultTail,
      ...descriptionRolls,
    ]);
    const atZero = rollZero(at, { heroicChance: 50 });
    expect(at.sidesAsked[0]).toBe(100);
    expect(atZero.abilities.strength.score).toBe(15);

    const above = scriptedDice([
      51,
      1,
      4,
      5,
      ...Array(5 * 3).fill(1),
      1,
      1,
      ...defaultTail,
      ...descriptionRolls,
    ]);
    const aboveZero = rollZero(above, { heroicChance: 50 });
    expect(above.sidesAsked[0]).toBe(100);
    expect(aboveZero.abilities.strength.score).toBe(10);
    expect(above.sidesAsked.slice(1, 19).every((s) => s === 6)).toBe(true);
  });

  it("makes no extra roll at chance 0 or 100", () => {
    const zero = scriptedDice([
      1,
      1,
      1,
      ...Array(5 * 3).fill(1),
      1,
      1,
      ...defaultTail,
      ...descriptionRolls,
    ]);
    rollZero(zero, { heroicChance: 0 });
    expect(zero.sidesAsked.slice(0, 18).every((s) => s === 6)).toBe(true);
  });

  it("rolls about half heroic at 50 over 2000 seeds", () => {
    let heroic = 0;
    for (let seed = 0; seed < 2000; seed++) {
      const recorder = recordingDice(seed);
      rollZero(recorder.dice, { heroicChance: 50 });
      if (recorder.sides[25] === 30) heroic++;
    }
    expect(heroic / 2000).toBeGreaterThanOrEqual(0.45);
    expect(heroic / 2000).toBeLessThanOrEqual(0.55);
  });

  it("shows the batch setting in headers and json", () => {
    expect(runCli("roll", "--heroic", "50").startsWith("Seed: 7 (heroic 50%)\n")).toBe(true);
    expect(
      runCli("roll", "--heroic", "50", "--format", "ascii").startsWith("Seed: 7 (heroic 50%)\n"),
    ).toBe(true);
    const json = JSON.parse(runCli("roll", "--heroic=50", "--format", "json"));
    expect(json.heroic).toBe(true);
    expect(json.heroicChance).toBe(50);
    expect(Object.keys(json)).toEqual(["seed", "heroic", "heroicChance", "survivors", "zeros"]);
    expect(JSON.parse(runCli("roll", "--format", "json")).heroicChance).toBe(0);
  });
});

import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { createSeededDice } from "../src/adapters/seeded-dice.js";
import { type Alignment, rollZero } from "../src/domain/index.js";

const bin = "dist/adapters/cli/bin.js";

function zeros(...args: string[]) {
  const result = spawnSync("node", [bin, ...args], { encoding: "utf8" });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

function json(...args: string[]) {
  const result = zeros(...args, "--format", "json");
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout);
}

const golden = `Seed: 1

Pashai - female, Lawful Philosopher
Features: a bone pin through the ear; a kilt of woven grass
STR  9 (+0)  AGI 14 (+1)  STA 12 (+0)
PER 12 (+0)  INT  6 (-1)  LCK  5 (-2)
HP 4  AC 11  Init +1  Speed 30
Attack: melee +0, missile +1
Saves: Ref +1  Fort +0  Will +0
Lucky roll: 12 (-2) Born in a smuggler's tunnel: Find secret doors
Weapon: Staff, 1d4
Trade goods: Wax tablet & stylus
Equipment: Empty chest
Copper: 29
Languages: Common (reads and writes)
XP: 0

Markeen the Truthful - male, Lawful Fisher of the Reeds
Features: shoulders hunched as if cold; huge, knotted knuckles
STR 13 (+1)  AGI  6 (-1)  STA  8 (-1)
PER  7 (-1)  INT 11 (+0)  LCK 13 (+1)
HP 1  AC 9  Init -1  Speed 30
Attack: melee +1, missile -1
Saves: Ref -1  Fort -1  Will -1
Lucky roll: 13 (+1) Seventh child of a witch: Spellcasting rolls
Weapon: Spear, 1d8
Trade goods: Reed basket of fish
Equipment: Torch
Copper: 56
Languages: Common (reads and writes)
XP: 0
`;

describe("cli", () => {
  it("prints the golden card set for seed 1", () => {
    const result = zeros("roll", "--seed", "1", "--count", "2");
    expect(result).toEqual({ stdout: golden, stderr: "", status: 0 });
  });

  it("prints json equal to the domain's zeros", () => {
    const out = json("roll", "--seed", "1", "--count", "2");
    expect(out.zeros).toHaveLength(2);
    const dice = createSeededDice(1);
    const expected = [rollZero(dice), rollZero(dice)];
    expect(out).toEqual({
      seed: 1,
      heroic: false,
      heroicChance: 0,
      survivors: false,
      demihumanChance: 0,
      zeros: expected,
    });
    expect(Object.keys(out)).toEqual([
      "seed",
      "heroic",
      "heroicChance",
      "survivors",
      "demihumanChance",
      "zeros",
    ]);
    expect(out.zeros[0].features).toEqual([
      { category: "Adornment and Marks", feature: "a bone pin through the ear" },
      { category: "Garb", feature: "a kilt of woven grass" },
    ]);
    expect(Object.keys(out.zeros[0]).at(-1)).toBe("features");
    expect(json("roll", "--seed", "1").zeros).toHaveLength(1);
  });

  it("count extends the seed", () => {
    const four = json("roll", "--seed", "5", "--count", "4");
    const one = json("roll", "--seed", "5");
    expect(four.zeros).toHaveLength(4);
    expect(four.zeros[0]).toEqual(one.zeros[0]);
    const { features: fourFeatures, ...fourRest } = four.zeros[0];
    const { features: oneFeatures, ...oneRest } = one.zeros[0];
    expect(fourFeatures).toHaveLength(2);
    expect(fourRest).toEqual(oneRest);
    expect(fourFeatures).toEqual(oneFeatures);
  });

  it("fixes alignment", () => {
    for (const alignment of ["lawful", "neutral", "chaotic"] as Alignment[]) {
      const out = json("roll", "--seed", "1", "--count", "3", "--alignment", alignment);
      expect(out.zeros).toHaveLength(3);
      for (const zero of out.zeros) expect(zero.alignment).toBe(alignment);
      expect(out.zeros[0]).toEqual(rollZero(createSeededDice(1), { alignment }));
    }
  });

  it("prints a random seed that reproduces the output", () => {
    const first = zeros("roll");
    expect(first.status).toBe(0);
    const match = first.stdout.match(/^Seed: (\d+)\n/);
    expect(match).not.toBeNull();
    const seed = Number(match?.[1]);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(4294967295);
    expect(zeros("roll", "--seed", String(seed)).stdout).toBe(first.stdout);
  });

  it("validates seed", () => {
    for (const seed of ["0", "4294967295"]) {
      expect(zeros("roll", "--seed", seed).stdout.startsWith(`Seed: ${seed}\n`)).toBe(true);
    }
    for (const args of [
      ["--seed", "4294967296"],
      ["--seed=-1"],
      ["--seed", "1.5"],
      ["--seed", "abc"],
      ["--seed", ""],
    ]) {
      expect(zeros("roll", ...args).status, args.join(" ")).toBe(2);
    }
  });

  it("validates count", () => {
    for (const count of ["1", "100"]) {
      expect(json("roll", "--seed", "1", "--count", count).zeros).toHaveLength(Number(count));
    }
    for (const count of ["0", "101", "2.5", "abc"]) {
      expect(zeros("roll", "--count", count).status, count).toBe(2);
    }
  });

  it("rejects bad usage", () => {
    for (const args of [
      [],
      ["nope"],
      ["roll", "--bogus"],
      ["roll", "--seed"],
      ["roll", "--seed", "-1"],
      ["roll", "--alignment", "good"],
      ["roll", "--format", "yaml"],
      ["roll", "--count", "4", "--format", "yaml"],
    ]) {
      const result = zeros(...args);
      expect(result.status, args.join(" ")).toBe(2);
      expect(result.stdout).toBe("");
      expect(result.stderr.startsWith("zeros:")).toBe(true);
    }
  });

  it("prints help", () => {
    for (const args of [["--help"], ["-h"], ["roll", "--help"]]) {
      const result = zeros(...args);
      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      for (const flag of ["--count", "--seed", "--alignment", "--format"]) {
        expect(result.stdout).toContain(flag);
      }
    }
  });

  it("takes the last of a repeated flag", () => {
    expect(zeros("roll", "--seed", "1", "--seed", "2").stdout.startsWith("Seed: 2\n")).toBe(true);
  });
});

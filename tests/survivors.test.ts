import { describe, expect, it } from "vitest";
import { parseCli } from "../src/adapters/cli/args.js";
import { run } from "../src/adapters/cli/run.js";
import { createSeededDice } from "../src/adapters/seeded-dice.js";
import { rollZero } from "../src/domain/index.js";
import { script, scriptedDice } from "./helpers.js";

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

function withSurvivors(hitDies: number[]) {
  const base = script({ stamina: 10, luck: 10 }, 6, hitDies[0] as number);
  const luckyIndex = 18;
  const values = [
    ...base.slice(0, luckyIndex + 2),
    ...hitDies.slice(1),
    ...base.slice(luckyIndex + 2),
  ];
  const dice = scriptedDice(values);
  const zero = rollZero(dice, { survivors: true });
  return { zero, dice, total: values.length };
}

describe("survivors", () => {
  it("parses --survivors and defaults it off", () => {
    expect(parseCli(["roll", "--survivors"])).toMatchObject({ kind: "roll", survivors: true });
    expect(parseCli(["roll"])).toMatchObject({ kind: "roll", survivors: false });
  });

  it("keeps the higher of two hit dice when the second is higher", () => {
    const { zero, dice, total } = withSurvivors([1, 3]);
    expect(zero.hitPoints).toBe(3);
    expect(dice.consumed()).toBe(total);
  });

  it("keeps the first hit die when it is higher", () => {
    const { zero, dice, total } = withSurvivors([4, 2]);
    expect(zero.hitPoints).toBe(4);
    expect(dice.consumed()).toBe(total);
  });

  it("keeps a tied hit die", () => {
    const { zero, dice, total } = withSurvivors([2, 2]);
    expect(zero.hitPoints).toBe(2);
    expect(dice.consumed()).toBe(total);
  });

  it("rolls exactly two d4 for hit points", () => {
    const sides: number[] = [];
    const inner = createSeededDice(3);
    rollZero(
      {
        roll: (n) => {
          sides.push(n);

          return inner.roll(n);
        },
      },
      { survivors: true },
    );
    expect(sides.slice(18, 21)).toEqual([30, 4, 4]);
  });

  it("leaves a roll without the flag unchanged", () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(rollZero(createSeededDice(seed), { survivors: false })).toEqual(
        rollZero(createSeededDice(seed)),
      );
    }
  });

  it("shows the setting in the text and ascii headers", () => {
    for (const format of ["text", "ascii"]) {
      const head = (...flags: string[]) =>
        runCli("roll", "--format", format, ...flags).split("\n")[0];
      expect(head("--survivors")).toBe("Seed: 7 (survivors)");
      expect(head("--heroic", "--survivors")).toBe("Seed: 7 (heroic, survivors)");
      expect(head("--heroic", "50", "--survivors")).toBe("Seed: 7 (heroic 50%, survivors)");
      expect(head("--heroic")).toBe("Seed: 7 (heroic)");
      expect(head()).toBe("Seed: 7");
    }
  });

  it("puts survivors after heroicChance in the JSON", () => {
    const on = JSON.parse(runCli("roll", "--survivors", "--format", "json"));
    expect(on.survivors).toBe(true);
    expect(Object.keys(on)).toEqual([
      "seed",
      "heroic",
      "heroicChance",
      "survivors",
      "demihumanChance",
      "zeros",
    ]);
    expect(JSON.parse(runCli("roll", "--format", "json")).survivors).toBe(false);
  });
});

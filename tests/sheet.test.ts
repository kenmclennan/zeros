import { describe, expect, it } from "vitest";
import { parseCli } from "../src/adapters/cli/args.js";
import { renderAscii } from "../src/adapters/cli/render.js";
import { renderSheet } from "../src/adapters/cli/sheet.js";
import { createSeededDice } from "../src/adapters/seeded-dice.js";
import { rollZero, type Zero } from "../src/domain/index.js";

const golden = `+--------------------------------------------------------------+
| PASHAI                                         0-level, XP 0 |
| Female human, Lawful                             Philosopher |
+--------------------------------------------------------------+
| A bone pin through the ear; a kilt of woven grass            |
+-------------------------------------+------------------------+
|  STR  AGI  STA  PER  INT  LCK       | HP 4        AC 11      |
|    9   14   12   12    6    5       | Init +1     Speed 30   |
|   +0   +1   +0   +0   -1   -2       | Crit d4 on table I     |
+-------------------------------------+------------------------+
| SAVES      Reflex +1   Fortitude +0   Will +0                |
| ATTACK     Melee +0    Missile +1                            |
| WEAPON     Staff, 1d4                                        |
+--------------------------------------------------------------+
| EQUIPMENT  Empty chest                                       |
| TRADE      Wax tablet & stylus                               |
| COPPER     29                                                |
| LANGUAGES  Common (reads and writes)                         |
+--------------------------------------------------------------+
| LUCKY ROLL 12 (-2) Born in a smuggler's tunnel: Find secret  |
|            doors                                             |
+--------------------------------------------------------------+`;

function seeded(seed: number, heroicChance = 0): Zero {
  return rollZero(createSeededDice(seed), { heroicChance });
}

describe("ascii sheet", () => {
  it("renders the golden sheet for a fixed seed", () => {
    expect(renderSheet(seeded(1))).toBe(golden);
  });

  it("is exactly 64 characters wide and pure ASCII across 200 seeds", () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const line of renderSheet(seeded(seed, seed % 2 === 0 ? 100 : 0)).split("\n")) {
        expect(line, `seed ${seed}`).toHaveLength(64);
        expect(line).toMatch(/^[\x20-\x7e]+$/);
      }
    }
  });

  it("wraps a long lucky roll and long features without widening", () => {
    const base = seeded(3);
    const zero: Zero = {
      ...base,
      luckyRoll: { ...base.luckyRoll, text: "word ".repeat(30) + "x".repeat(90) },
      features: [
        { ...(base.features[0] as Zero["features"][number]), feature: "long feature ".repeat(12) },
      ],
      name: { ...base.name, display: "Extremely Long Name ".repeat(4) },
    };
    const lines = renderSheet(zero).split("\n");
    for (const line of lines) expect(line).toHaveLength(64);
    const lucky = lines.findIndex((line) => line.startsWith("| LUCKY ROLL"));
    expect(lines[lucky + 1]?.startsWith("|            ")).toBe(true);
  });

  it("puts a right part that does not fit on its own line", () => {
    const base = seeded(3);
    const zero: Zero = { ...base, name: { ...base.name, display: "N".repeat(50) } };
    const lines = renderSheet(zero).split("\n");
    expect(lines[1]).toBe(`| ${"N".repeat(50)}${" ".repeat(10)} |`);
    expect(lines[2]).toBe(`| ${"0-level, XP 0".padStart(60)} |`);
  });

  it("prints the seed header then sheets separated by one blank line", () => {
    const [first, second] = [seeded(1), seeded(2)] as [Zero, Zero];
    const zeros = [first, second];
    expect(renderAscii(7, 100, zeros)).toBe(
      `Seed: 7 (heroic)\n\n${renderSheet(first)}\n\n${renderSheet(second)}\n`,
    );
    expect(renderAscii(7, 0, zeros).startsWith("Seed: 7\n\n+")).toBe(true);
  });

  it("parses --format ascii", () => {
    expect(parseCli(["roll", "--format", "ascii"])).toMatchObject({
      kind: "roll",
      format: "ascii",
    });
  });
});

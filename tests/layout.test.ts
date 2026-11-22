import { describe, expect, it } from "vitest";
import { parseCli } from "../src/adapters/cli/args.js";
import { renderAscii } from "../src/adapters/cli/render.js";
import { blankSheet, renderSheet } from "../src/adapters/cli/sheet.js";
import { createSeededDice } from "../src/adapters/seeded-dice.js";
import { rollZero, type Zero } from "../src/domain/index.js";

const goldenBlank = `+--------------------------------------------------------------+
|                                                0-level, XP 0 |
|                                                              |
+--------------------------------------------------------------+
|                                                              |
+-------------------------------------+------------------------+
|  STR  AGI  STA  PER  INT  LCK       | HP          AC         |
|                                     | Init        Speed      |
|                                     | Crit d4 on table I     |
+-------------------------------------+------------------------+
| SAVES      Reflex      Fortitude      Will                   |
| ATTACK     Melee       Missile                               |
| WEAPON                                                       |
+--------------------------------------------------------------+
| EQUIPMENT                                                    |
| TRADE                                                        |
| COPPER                                                       |
| LANGUAGES                                                    |
+--------------------------------------------------------------+
| LUCKY ROLL                                                   |
+--------------------------------------------------------------+`;

function zeros(count: number): Zero[] {
  const dice = createSeededDice(5);
  return Array.from({ length: count }, () => rollZero(dice, { heroicChance: 0 }));
}

function pages(count: number): string[] {
  const output = renderAscii(5, 0, zeros(count), "4-up");
  return output.slice("Seed: 5\n\n".length, -1).split("\n\f\n");
}

function blankCount(page: string): number {
  return page.split(`|${" ".repeat(48)}0-level, XP 0 |`).length - 1;
}

describe("--layout parsing", () => {
  it("defaults to 1-up", () => {
    expect(parseCli(["roll"])).toMatchObject({ layout: "1-up" });
  });

  it("accepts 4-up with ascii", () => {
    expect(parseCli(["roll", "--format", "ascii", "--layout", "4-up"])).toMatchObject({
      kind: "roll",
      layout: "4-up",
    });
    expect(parseCli(["roll", "--format", "ascii", "--layout", "1-up"])).toMatchObject({
      layout: "1-up",
    });
  });

  it("rejects an unknown layout naming both", () => {
    expect(parseCli(["roll", "--layout", "2-up"])).toEqual({
      kind: "error",
      message: "--layout must be 1-up or 4-up",
    });
  });

  it("rejects 4-up without ascii", () => {
    const message = "--layout 4-up needs --format ascii";
    expect(parseCli(["roll", "--layout", "4-up"])).toEqual({ kind: "error", message });
    expect(parseCli(["roll", "--format", "json", "--layout", "4-up"])).toEqual({
      kind: "error",
      message,
    });
  });
});

describe("4-up layout", () => {
  it("renders the golden blank sheet", () => {
    expect(blankSheet).toBe(goldenBlank);
    for (const line of blankSheet.split("\n")) expect(line).toHaveLength(64);
  });

  it("leaves 1-up output unchanged", () => {
    const list = zeros(2);
    expect(renderAscii(5, 0, list, "1-up")).toBe(renderAscii(5, 0, list));
    expect(renderAscii(5, 0, list)).toBe(`Seed: 5\n\n${list.map(renderSheet).join("\n\n")}\n`);
  });

  it("prints the header, a blank line, then pages", () => {
    expect(renderAscii(5, 0, zeros(1), "4-up").startsWith("Seed: 5\n\n+")).toBe(true);
  });

  it("makes 1, 1, 2 and 2 pages for 1, 4, 5 and 8 characters", () => {
    expect(pages(1)).toHaveLength(1);
    expect(pages(4)).toHaveLength(1);
    expect(pages(5)).toHaveLength(2);
    expect(pages(8)).toHaveLength(2);
  });

  it("fills unused positions with blank sheets", () => {
    expect(blankCount(pages(4)[0] as string)).toBe(0);
    expect(blankCount(pages(1)[0] as string)).toBe(3);
    expect(blankCount(pages(5)[1] as string)).toBe(3);
    expect(blankCount(pages(6)[1] as string)).toBe(2);
    expect(blankCount(pages(8)[1] as string)).toBe(0);
  });

  it("keeps every line within 130 characters with no trailing spaces", () => {
    for (const count of [1, 4, 5, 6, 8]) {
      for (const line of renderAscii(5, 0, zeros(count), "4-up").split("\n")) {
        if (line === "" || line === "\f") continue;
        expect(line.length).toBeLessThanOrEqual(130);
        expect(line).toBe(line.trimEnd());
      }
    }
  });

  it("separates the two rows by one blank line and puts a form feed alone between pages", () => {
    const output = renderAscii(5, 0, zeros(5), "4-up");
    expect(output.split("\f")).toHaveLength(2);
    expect(output).toContain("\n\f\n");
    const firstPage = pages(5)[0] as string;
    expect(firstPage.split("\n\n")).toHaveLength(2);
    expect(output.endsWith("+\n")).toBe(true);
  });

  it("pads a shorter sheet below its box so the row aligns", () => {
    const base = zeros(1)[0] as Zero;
    const tall: Zero = { ...base, luckyRoll: { ...base.luckyRoll, text: "word ".repeat(30) } };
    const [first] = [renderSheet(tall)];
    const tallHeight = (first as string).split("\n").length;
    const shortHeight = renderSheet(base).split("\n").length;
    expect(tallHeight).toBeGreaterThan(shortHeight);
    const output = renderAscii(5, 0, [tall, base], "4-up");
    const rowOne = (output.split("\n\n")[1] as string).split("\n");
    expect(rowOne).toHaveLength(tallHeight);
    expect(rowOne[tallHeight - 1]).toBe((first as string).split("\n").at(-1));
    expect(rowOne[shortHeight]?.slice(66)).toBe(
      blankSheet.split("\n")[shortHeight]?.trimEnd() ?? "",
    );
  });
});

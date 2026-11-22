import { describe, expect, it } from "vitest";
import { renderCard } from "../src/adapters/cli/card.js";
import { rollZero } from "../src/domain/index.js";
import { defaultTail, type Scores, script, scriptedDice } from "./helpers.js";

function card(scores: Scores, tail: number[] = defaultTail) {
  const zero = rollZero(scriptedDice(script(scores, 15, 2, tail)));
  return { zero, text: renderCard(zero) };
}

describe("card", () => {
  it("renders languages", () => {
    expect(card({ intelligence: 12 }).text).toContain("Languages: Common (reads and writes)\n");
    expect(card({ intelligence: 18 }).text).toContain(
      "Languages: Common +3 extra (reads and writes)\n",
    );
    expect(card({ intelligence: 5 }).text).toContain("Languages: Common (cannot read or write)\n");
    expect(card({ intelligence: 7 }).text).not.toContain("extra");
  });

  it("aligns ability scores and signs modifiers", () => {
    const { text } = card({ strength: 3, agility: 18, stamina: 10, personality: 10 });
    const lines = text.split("\n");
    expect(lines[2]).toContain("STR  3 (-3)");
    expect(lines[2]).toContain("AGI 18 (+3)");
    expect(lines[2]).toContain("STA 10 (+0)");
  });

  it("renders features", () => {
    const { zero, text } = card({});
    const lines = text.split("\n");
    expect(lines[1]).toMatch(/^Features: /);
    expect(lines[1]).toBe(`Features: ${zero.features.map((entry) => entry.feature).join("; ")}`);
    expect(lines).toHaveLength(14);
  });

  it("singular dose", () => {
    const one = card({}, [35, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100, 1]);
    expect(one.text).toContain("Trade goods: ");
    expect(one.text).toContain("Trade goods: 1 dose of healing salve (1 hp each)");
    expect(one.zero.occupation.tradeGoods).toContain("1 dose of");
    const two = card({}, [35, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100, 2]);
    expect(two.text).toContain("Trade goods: 2 doses of healing salve (1 hp each)");
  });
});

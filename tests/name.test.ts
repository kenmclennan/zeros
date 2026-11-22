import { describe, expect, it } from "vitest";
import { rollZero } from "../src/domain/index.js";
import { script, scriptedDice } from "./helpers.js";

function name(tail: number[]) {
  const dice = scriptedDice(script({}, 1, 1, [1, 1, 1, 1, 1, 1, 1, 1, ...tail]));
  return { zero: rollZero(dice), dice };
}

describe("name", () => {
  it("sex name and nickname", () => {
    expect(name([1, 1, 41]).zero.sex).toBe("male");
    expect(name([2, 1, 41]).zero.sex).toBe("female");

    expect(name([1, 1, 41]).zero.name).toEqual({
      given: "Araltuk",
      nickname: null,
      display: "Araltuk",
    });
    expect(name([1, 1, 3, 3]).zero.name.display).toBe("Araltuk Long-beard");
    expect(name([1, 1, 1, 7]).zero.name.display).toBe("Araltuk the Arrogant");
    expect(name([2, 1, 40, 3]).zero.name.display).toBe("Alherin the Bear");
    expect(name([2, 100, 41]).zero.name.given).toBe("Zilshana");
    expect(name([1, 100, 41]).zero.name.given).toBe("Yarakoor");
  });

  it("draws the nickname only on 1-40", () => {
    const withNickname = name([1, 1, 40, 3]);
    expect(withNickname.dice.sidesAsked.slice(28)).toEqual([2, 100, 100, 100, 10, 20, 10, 20]);
    const without = name([1, 1, 41]);
    expect(without.dice.sidesAsked.slice(28)).toEqual([2, 100, 100, 10, 20, 10, 20]);
  });
});

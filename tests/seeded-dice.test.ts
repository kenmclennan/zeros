import { describe, expect, it } from "vitest";
import { createSeededDice } from "../src/adapters/seeded-dice.js";
import { rollZero } from "../src/domain/index.js";
import { scriptedDice } from "./helpers.js";

describe("seeded dice", () => {
  it("golden zero for seeds 1 and 2", () => {
    expect(rollZero(createSeededDice(1))).toMatchInlineSnapshot(`
      {
        "abilities": {
          "agility": {
            "modifier": 1,
            "score": 14,
          },
          "intelligence": {
            "modifier": -1,
            "score": 6,
          },
          "luck": {
            "modifier": -2,
            "score": 5,
          },
          "personality": {
            "modifier": 0,
            "score": 12,
          },
          "stamina": {
            "modifier": 0,
            "score": 12,
          },
          "strength": {
            "modifier": 0,
            "score": 9,
          },
        },
        "alignment": "lawful",
        "armorClass": 11,
        "attack": {
          "melee": 0,
          "missile": 1,
        },
        "crit": {
          "die": 4,
          "table": "I",
        },
        "equipment": "Empty chest",
        "experience": 0,
        "features": [
          {
            "category": "Adornment and Marks",
            "feature": "a bone pin through the ear",
          },
          {
            "category": "Garb",
            "feature": "a kilt of woven grass",
          },
        ],
        "hitPoints": 4,
        "initiative": 1,
        "languages": {
          "canReadAndWrite": true,
          "common": true,
          "extraLanguages": 0,
          "racial": null,
        },
        "luckyRoll": {
          "appliesTo": null,
          "modifier": -2,
          "roll": 12,
          "text": "Born in a smuggler's tunnel: Find secret doors",
        },
        "money": {
          "copper": 29,
        },
        "name": {
          "display": "Pashai",
          "given": "Pashai",
          "nickname": null,
        },
        "occupation": {
          "name": "Lotus-Eater",
          "tradeGoods": "Pouch of lotus leaves",
          "weapon": {
            "damage": "1d4",
            "fightsAs": "Dagger",
            "written": "Razor (dagger)",
          },
        },
        "race": "human",
        "saves": {
          "fortitude": 0,
          "reflex": 1,
          "will": 0,
        },
        "sex": "female",
        "speed": 30,
        "traits": [],
      }
    `);
    expect(rollZero(createSeededDice(2))).toMatchInlineSnapshot(`
      {
        "abilities": {
          "agility": {
            "modifier": 1,
            "score": 14,
          },
          "intelligence": {
            "modifier": 1,
            "score": 13,
          },
          "luck": {
            "modifier": 0,
            "score": 9,
          },
          "personality": {
            "modifier": -1,
            "score": 8,
          },
          "stamina": {
            "modifier": 0,
            "score": 11,
          },
          "strength": {
            "modifier": 0,
            "score": 9,
          },
        },
        "alignment": "neutral",
        "armorClass": 11,
        "attack": {
          "melee": 0,
          "missile": 1,
        },
        "crit": {
          "die": 4,
          "table": "I",
        },
        "equipment": "Tallow candle",
        "experience": 0,
        "features": [
          {
            "category": "Expression",
            "feature": "a bold, level stare",
          },
          {
            "category": "Bearing",
            "feature": "a stoop",
          },
        ],
        "hitPoints": 1,
        "initiative": 1,
        "languages": {
          "canReadAndWrite": true,
          "common": true,
          "extraLanguages": 1,
          "racial": null,
        },
        "luckyRoll": {
          "appliesTo": "speed",
          "modifier": 0,
          "roll": 30,
          "text": "Ran with the wild horses: Speed (each +1/-1 = +5'/-5' speed)",
        },
        "money": {
          "copper": 24,
        },
        "name": {
          "display": "Fasha",
          "given": "Fasha",
          "nickname": null,
        },
        "occupation": {
          "name": "Wanderer",
          "tradeGoods": "Travel cloak",
          "weapon": {
            "damage": "1d8",
            "fightsAs": "Spear",
            "written": "Spear",
          },
        },
        "race": "human",
        "saves": {
          "fortitude": 0,
          "reflex": 1,
          "will": -1,
        },
        "sex": "female",
        "speed": 30,
        "traits": [],
      }
    `);
  });

  it("gives the same zero for the same seed and a different one otherwise", () => {
    expect(rollZero(createSeededDice(1))).toEqual(rollZero(createSeededDice(1)));
    expect(rollZero(createSeededDice(1))).not.toEqual(rollZero(createSeededDice(2)));
  });

  it("agrees with the rules when its outcomes are replayed through scripted dice", () => {
    const recorder = createSeededDice(1);
    const values: number[] = [];
    const sides = [
      ...Array(18).fill(6),
      30,
      4,
      100,
      24,
      12,
      12,
      12,
      12,
      12,
      6,
      2,
      100,
      100,
      10,
      20,
      10,
      20,
    ];
    for (const s of sides) values.push(recorder.roll(s));
    expect(rollZero(scriptedDice(values))).toEqual(rollZero(createSeededDice(1)));
  });

  it("stays in range and reaches every face", () => {
    const dice = createSeededDice(7);
    for (const sides of [6, 30]) {
      const seen = new Set<number>();
      for (let i = 0; i < 20000; i++) {
        const value = dice.roll(sides);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(sides);
        seen.add(value);
      }
      expect(seen.size).toBe(sides);
    }
  });

  it("rolls a one-sided die as 1", () => {
    const dice = createSeededDice(3);
    for (let i = 0; i < 100; i++) expect(dice.roll(1)).toBe(1);
  });
});

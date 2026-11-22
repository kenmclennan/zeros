import type { Dice } from "../domain/ports/dice.js";

export function createSeededDice(seed: number): Dice {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    roll(sides: number): number {
      return 1 + Math.floor(next() * sides);
    },
  };
}

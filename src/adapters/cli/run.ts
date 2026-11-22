import { rollZero, type Zero } from "../../domain/index.js";
import { createSeededDice } from "../seeded-dice.js";
import { parseCli, usage } from "./args.js";
import { renderAscii, renderJson, renderText } from "./render.js";

export interface Io {
  stdout(text: string): void;
  stderr(text: string): void;
  randomSeed(): number;
}

export function run(argv: string[], io: Io): number {
  const args = parseCli(argv);

  if (args.kind === "help") {
    io.stdout(usage);
    return 0;
  }
  if (args.kind === "error") {
    io.stderr(`zeros: ${args.message}\n`);
    return 2;
  }

  const seed = args.seed ?? io.randomSeed();
  const dice = createSeededDice(seed);
  const options = {
    ...(args.alignment === null ? {} : { alignment: args.alignment }),
    heroicChance: args.heroicChance,
    survivors: args.survivors,
  };
  const zeros: Zero[] = [];
  for (let i = 0; i < args.count; i++) zeros.push(rollZero(dice, options));

  if (args.format === "ascii") {
    io.stdout(renderAscii(seed, args.heroicChance, zeros, args.layout, args.survivors));
  } else if (args.format === "json") {
    io.stdout(renderJson(seed, args.heroicChance, zeros, args.survivors));
  } else {
    io.stdout(renderText(seed, args.heroicChance, zeros, args.survivors));
  }
  return 0;
}

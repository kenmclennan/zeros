import { parseArgs } from "node:util";
import type { Alignment } from "../../domain/index.js";

export type Format = "text" | "json" | "ascii";
export type Layout = "1-up" | "4-up";

export interface RollArgs {
  kind: "roll";
  count: number;
  seed: number | null;
  alignment: Alignment | null;
  heroicChance: number;
  survivors: boolean;
  demihumanChance: number;
  format: Format;
  layout: Layout;
}

export type ParsedArgs = RollArgs | { kind: "help" } | { kind: "error"; message: string };

const maxCount = 100;
const maxSeed = 4294967295;
const alignments: readonly string[] = ["lawful", "neutral", "chaotic"];
const formats: readonly string[] = ["text", "json", "ascii"];
const layouts: readonly string[] = ["1-up", "4-up"];

export const usage = `Usage:
  zeros roll [--count N] [--seed S] [--alignment lawful|neutral|chaotic] [--heroic [P]] [--survivors] [--demihumans P] [--format text|json|ascii] [--layout 1-up|4-up]
  zeros --help | -h

Options:
  --count N        how many zeros to roll, 1-${maxCount} (default 1)
  --seed S         seed the dice, 0-${maxSeed} (default: a fresh random seed, always printed)
  --alignment A    fix every zero's alignment: lawful, neutral or chaotic (default: rolled)
  --heroic [P]     roll abilities as 4d6, dropping the lowest die, for P% of characters (default 100; without the flag, 3d6)
  --survivors      roll the hit die twice and keep the higher result (default off)
  --demihumans P   P% of zeros are dwarves, elves or halflings (default: all human)
  --format F       text, json or ascii (default text)
  --layout L       1-up or 4-up: four sheets per page on a 2x2 grid (ascii only; default 1-up)
  --help, -h       print this help
`;

function parseInteger(flag: string, value: string, min: number, max: number): number | string {
  if (!/^\d+$/.test(value)) return `${flag} must be an integer from ${min} to ${max}`;
  const parsed = Number(value);
  if (parsed < min || parsed > max) return `${flag} must be an integer from ${min} to ${max}`;
  return parsed;
}

const heroicFlag = "--heroic";
const heroicRangeMessage = "--heroic must be an integer from 1 to 100";

function extractHeroic(argv: string[]): { rest: string[]; chance: number } | string {
  const rest: string[] = [];
  let chance = 0;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] as string;
    if (token === "--") {
      rest.push(...argv.slice(i));
      break;
    }
    if (token === heroicFlag) {
      const next = argv[i + 1];
      if (next !== undefined && /^\d+$/.test(next)) {
        const result = parseInteger(heroicFlag, next, 1, 100);
        if (typeof result === "string") return heroicRangeMessage;
        chance = result;
        i++;
      } else {
        chance = 100;
      }
    } else if (token.startsWith(`${heroicFlag}=`)) {
      const result = parseInteger(heroicFlag, token.slice(heroicFlag.length + 1), 1, 100);
      if (typeof result === "string") return heroicRangeMessage;
      chance = result;
    } else {
      rest.push(token);
    }
  }
  return { rest, chance };
}

const demihumansFlag = "--demihumans";
const demihumansMessage = "--demihumans needs a percentage from 1 to 100";

function extractDemihumans(argv: string[]): { rest: string[]; chance: number } | string {
  const rest: string[] = [];
  let chance = 0;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] as string;
    if (token === "--") {
      rest.push(...argv.slice(i));
      break;
    }
    let raw: string | undefined;
    if (token === demihumansFlag) {
      raw = argv[i + 1] ?? "";
      i++;
    } else if (token.startsWith(`${demihumansFlag}=`)) {
      raw = token.slice(demihumansFlag.length + 1);
    }
    if (raw === undefined) {
      rest.push(token);
      continue;
    }
    const result = parseInteger(demihumansFlag, raw, 1, 100);
    if (typeof result === "string") return demihumansMessage;
    chance = result;
  }
  return { rest, chance };
}

export function parseCli(argv: string[]): ParsedArgs {
  const withoutDemihumans = extractDemihumans(argv);
  if (typeof withoutDemihumans === "string") return { kind: "error", message: withoutDemihumans };
  const extracted = extractHeroic(withoutDemihumans.rest);
  if (typeof extracted === "string") return { kind: "error", message: extracted };

  let parsed: ReturnType<typeof parseOptions>;
  try {
    parsed = parseOptions(extracted.rest);
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }
  const { values, positionals } = parsed;

  if (values.help) return { kind: "help" };
  const [subcommand, ...rest] = positionals;
  if (subcommand === undefined) return { kind: "error", message: "missing command, try: roll" };
  if (subcommand !== "roll") return { kind: "error", message: `unknown command ${subcommand}` };
  if (rest.length > 0) return { kind: "error", message: `unexpected argument ${rest[0]}` };

  let count = 1;
  if (values.count !== undefined) {
    const result = parseInteger("--count", values.count, 1, maxCount);
    if (typeof result === "string") return { kind: "error", message: result };
    count = result;
  }

  let seed: number | null = null;
  if (values.seed !== undefined) {
    const result = parseInteger("--seed", values.seed, 0, maxSeed);
    if (typeof result === "string") return { kind: "error", message: result };
    seed = result;
  }

  let alignment: Alignment | null = null;
  if (values.alignment !== undefined) {
    if (!alignments.includes(values.alignment)) {
      return { kind: "error", message: "--alignment must be lawful, neutral or chaotic" };
    }
    alignment = values.alignment as Alignment;
  }

  let format: Format = "text";
  if (values.format !== undefined) {
    if (!formats.includes(values.format)) {
      return { kind: "error", message: "--format must be text, json or ascii" };
    }
    format = values.format as Format;
  }

  let layout: Layout = "1-up";
  if (values.layout !== undefined) {
    if (!layouts.includes(values.layout)) {
      return { kind: "error", message: "--layout must be 1-up or 4-up" };
    }
    layout = values.layout as Layout;
  }
  if (layout === "4-up" && format !== "ascii") {
    return { kind: "error", message: "--layout 4-up needs --format ascii" };
  }

  return {
    kind: "roll",
    count,
    seed,
    alignment,
    heroicChance: extracted.chance,
    survivors: values.survivors === true,
    demihumanChance: withoutDemihumans.chance,
    format,
    layout,
  };
}

function parseOptions(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      count: { type: "string" },
      seed: { type: "string" },
      alignment: { type: "string" },
      format: { type: "string" },
      layout: { type: "string" },
      survivors: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
}

import type { Zero } from "../../domain/index.js";
import type { Layout } from "./args.js";
import { renderCard } from "./card.js";
import { renderSheet, renderSheetsFourUp } from "./sheet.js";

function renderHeader(
  seed: number,
  heroicChance: number,
  survivors: boolean,
  demihumanChance: number,
): string {
  const settings: string[] = [];
  if (heroicChance === 100) settings.push("heroic");
  else if (heroicChance > 0) settings.push(`heroic ${heroicChance}%`);
  if (survivors) settings.push("survivors");
  if (demihumanChance > 0) settings.push(`demihumans ${demihumanChance}%`);
  return settings.length === 0 ? `Seed: ${seed}` : `Seed: ${seed} (${settings.join(", ")})`;
}

export function renderText(
  seed: number,
  heroicChance: number,
  zeros: Zero[],
  survivors = false,
  demihumanChance = 0,
): string {
  return `${renderHeader(seed, heroicChance, survivors, demihumanChance)}\n\n${zeros.map(renderCard).join("\n\n")}\n`;
}

export function renderJson(
  seed: number,
  heroicChance: number,
  zeros: Zero[],
  survivors = false,
  demihumanChance = 0,
): string {
  return `${JSON.stringify({ seed, heroic: heroicChance > 0, heroicChance, survivors, demihumanChance, zeros }, null, 2)}\n`;
}

export function renderAscii(
  seed: number,
  heroicChance: number,
  zeros: Zero[],
  layout: Layout = "1-up",
  survivors = false,
  demihumanChance = 0,
): string {
  const header = renderHeader(seed, heroicChance, survivors, demihumanChance);
  if (layout === "4-up") {
    return `${header}\n\n${renderSheetsFourUp(zeros.map(renderSheet))}\n`;
  }
  return `${header}\n\n${zeros.map(renderSheet).join("\n\n")}\n`;
}

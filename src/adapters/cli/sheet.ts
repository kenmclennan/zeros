import { abilityNames, type Zero } from "../../domain/index.js";
import {
  capitalise,
  featureText,
  languages,
  luckyRollText,
  occupationTitle,
  signed,
  traitsText,
  weaponText,
} from "./wording.js";

const contentWidth = 60;
const labelWidth = 11;
const abilityColumnWidth = 5;
const leftCellWidth = 37;
const rightContentWidth = 22;
const rightCellWidth = 24;
const minimumGap = 2;

const abilityLabels = ["STR", "AGI", "STA", "PER", "INT", "LCK"];

const fullRule = `+${"-".repeat(contentWidth + 2)}+`;
const splitRule = `+${"-".repeat(leftCellWidth)}+${"-".repeat(rightCellWidth)}+`;

function asciiOnly(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "");
}

function wrap(text: string, width: number): string[] {
  const plain = asciiOnly(text);
  if (plain.length <= width) return [plain];
  const lines: string[] = [];
  let current = "";
  for (const word of plain.split(/\s+/).filter((part) => part !== "")) {
    let rest = word;
    while (rest.length > width) {
      if (current !== "") {
        lines.push(current);
        current = "";
      }
      lines.push(rest.slice(0, width));
      rest = rest.slice(width);
    }
    if (current === "") current = rest;
    else if (current.length + 1 + rest.length <= width) current = `${current} ${rest}`;
    else {
      lines.push(current);
      current = rest;
    }
  }
  if (current !== "" || lines.length === 0) lines.push(current);
  return lines;
}

function boxed(content: string): string {
  return `| ${content.padEnd(contentWidth)} |`;
}

function paragraph(text: string): string[] {
  return wrap(text, contentWidth).map(boxed);
}

function headerLines(rawLeft: string, rawRight: string): string[] {
  const left = asciiOnly(rawLeft);
  const right = asciiOnly(rawRight);
  if (left.length + minimumGap + right.length <= contentWidth) {
    return [boxed(left + right.padStart(contentWidth - left.length))];
  }
  return [...paragraph(left), boxed(right.padStart(contentWidth))];
}

function labelled(label: string, value: string): string[] {
  return wrap(value, contentWidth - labelWidth).map((line, index) =>
    boxed(`${index === 0 ? label.padEnd(labelWidth) : " ".repeat(labelWidth)}${line}`),
  );
}

function columns(cells: string[], width: number): string {
  return cells.map((cell) => cell.padEnd(width)).join("");
}

function statCells(cells: string[]): string {
  return ` ${columns(cells.slice(0, 1), 12)}${cells.slice(1).join("")}`
    .slice(1)
    .padEnd(rightContentWidth);
}

function statsRows(zero: Zero): string[] {
  const names = abilityNames;
  const scores = names.map((name) =>
    String(zero.abilities[name].score).padStart(abilityColumnWidth),
  );
  const modifiers = names.map((name) =>
    signed(zero.abilities[name].modifier).padStart(abilityColumnWidth),
  );
  const labels = abilityLabels.map((label) => label.padStart(abilityColumnWidth));
  const left = [labels, scores, modifiers].map((cells) => cells.join("").padEnd(leftCellWidth));
  const right = [
    [`HP ${zero.hitPoints}`, `AC ${zero.armorClass}`],
    [`Init ${signed(zero.initiative)}`, `Speed ${zero.speed}`],
    [`Crit d${zero.crit.die} on table ${zero.crit.table}`],
  ].map((cells) => ` ${statCells(cells)} `);
  return left.map((cell, index) => `|${cell}|${right[index]}|`);
}

export function renderSheet(zero: Zero): string {
  const { occupation, saves, attack } = zero;
  const name = zero.name.display.toUpperCase();
  return [
    fullRule,
    ...headerLines(name, `0-level, XP ${zero.experience}`),
    ...headerLines(
      `${capitalise(zero.sex)} ${zero.race}, ${capitalise(zero.alignment)}`,
      occupationTitle(zero),
    ),
    fullRule,
    ...paragraph(capitalise(featureText(zero))),
    splitRule,
    ...statsRows(zero),
    splitRule,
    ...labelled(
      "SAVES",
      `Reflex ${signed(saves.reflex)}   Fortitude ${signed(saves.fortitude)}   Will ${signed(saves.will)}`,
    ),
    ...labelled(
      "ATTACK",
      columns([`Melee ${signed(attack.melee)}`, `Missile ${signed(attack.missile)}`], 12).trimEnd(),
    ),
    ...labelled("WEAPON", weaponText(zero)),
    fullRule,
    ...labelled("EQUIPMENT", zero.equipment),
    ...labelled("TRADE", occupation.tradeGoods),
    ...labelled("COPPER", String(zero.money.copper)),
    ...labelled("LANGUAGES", languages(zero)),
    ...(zero.traits.length === 0 ? [] : labelled("TRAITS", traitsText(zero))),
    fullRule,
    ...labelled("LUCKY ROLL", luckyRollText(zero)),
    fullRule,
  ].join("\n");
}

export const blankSheet = [
  fullRule,
  boxed("0-level, XP 0".padStart(contentWidth)),
  boxed(""),
  fullRule,
  boxed(""),
  splitRule,
  `|${"  STR  AGI  STA  PER  INT  LCK".padEnd(leftCellWidth)}|${" HP          AC".padEnd(rightCellWidth)}|`,
  `|${"".padEnd(leftCellWidth)}|${" Init        Speed".padEnd(rightCellWidth)}|`,
  `|${"".padEnd(leftCellWidth)}|${" Crit d4 on table I".padEnd(rightCellWidth)}|`,
  splitRule,
  boxed("SAVES      Reflex      Fortitude      Will"),
  boxed("ATTACK     Melee       Missile"),
  boxed("WEAPON"),
  fullRule,
  boxed("EQUIPMENT"),
  boxed("TRADE"),
  boxed("COPPER"),
  boxed("LANGUAGES"),
  boxed("TRAITS"),
  fullRule,
  boxed("LUCKY ROLL"),
  fullRule,
].join("\n");

const sheetsPerPage = 4;
const sheetGap = "  ";
const sheetWidth = contentWidth + 4;

function joinRow(left: string, right: string): string {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const height = Math.max(leftLines.length, rightLines.length);
  const lines: string[] = [];
  for (let i = 0; i < height; i++) {
    const rightLine = rightLines[i] ?? "";
    const leftLine = leftLines[i] ?? "";
    lines.push(
      rightLine === ""
        ? leftLine.trimEnd()
        : `${leftLine.padEnd(sheetWidth)}${sheetGap}${rightLine}`.trimEnd(),
    );
  }
  return lines.join("\n");
}

export function renderSheetsFourUp(sheets: string[]): string {
  const pages: string[] = [];
  for (let start = 0; start < sheets.length; start += sheetsPerPage) {
    const slots = Array.from(
      { length: sheetsPerPage },
      (_, index) => sheets[start + index] ?? blankSheet,
    );
    const rows = [
      joinRow(slots[0] as string, slots[1] as string),
      joinRow(slots[2] as string, slots[3] as string),
    ];
    pages.push(rows.join("\n\n"));
  }
  return pages.join("\n\f\n");
}

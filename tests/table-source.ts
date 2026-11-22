import { readFileSync } from "node:fs";

export interface SourceRow {
  rolls: number[];
  cells: string[];
}

export function parseTable(markdown: string): SourceRow[] {
  return markdown
    .split("\n")
    .filter((line) => /^\| \d/.test(line))
    .map((line) => {
      const [roll = "", ...cells] = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      const [from = 0, to] = roll.split("-").map(Number);
      const end = to ?? from;
      return { rolls: Array.from({ length: end - from + 1 }, (_, i) => from + i), cells };
    });
}

export function readTable(path: string, heading?: string): SourceRow[] {
  const markdown = readFileSync(path, "utf8");
  if (!heading) return parseTable(markdown);
  const section = markdown.split(`## ${heading}\n`)[1]?.split(/\n## /)[0];
  if (section === undefined) throw new Error(`no section ${heading} in ${path}`);
  return parseTable(section);
}

export function coverageProblems(rolls: number[]): string[] {
  const counts = new Map<number, number>();
  for (const roll of rolls) counts.set(roll, (counts.get(roll) ?? 0) + 1);
  const problems: string[] = [];
  for (let roll = 1; roll <= 100; roll++) {
    const count = counts.get(roll) ?? 0;
    if (count === 0) problems.push(`missing ${roll}`);
    if (count > 1) problems.push(`duplicate ${roll}`);
  }
  return problems;
}

export interface CategorySource {
  name: string;
  features: string[];
  implies: string[];
  rolls: number[];
}

export function parseCategories(markdown: string): CategorySource[] {
  return markdown
    .split(/\n### /)
    .slice(1)
    .map((section) => {
      const [title = ""] = section.split("\n");
      const rows = parseTable(section);
      return {
        name: title.replace(/^\w+ \d+\. /, ""),
        features: rows.map((row) => row.cells[0] ?? ""),
        implies: rows.map((row) => row.cells[1] ?? ""),
        rolls: rows.flatMap((row) => row.rolls),
      };
    });
}

export function readCategories(path: string, setHeading: string): CategorySource[] {
  const markdown = readFileSync(path, "utf8");
  const section = markdown.split(`## ${setHeading}\n`)[1]?.split(/\n## /)[0];
  if (section === undefined) throw new Error(`no section ${setHeading} in ${path}`);
  return parseCategories(section);
}

export function duplicateFeatures(features: string[]): string[] {
  return features.filter((feature, i) => features.indexOf(feature) !== i);
}

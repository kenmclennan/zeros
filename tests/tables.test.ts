import { describe, expect, it } from "vitest";
import {
  descriptionTables,
  femaleNames,
  femaleNicknames,
  maleNames,
  maleNicknames,
  occupationTable,
} from "../src/domain/index.js";
import {
  coverageProblems,
  duplicateFeatures,
  parseCategories,
  parseTable,
  readCategories,
  readTable,
} from "./table-source.js";

const namesPath = "docs/tables/names.md";
const nameTables = [
  { heading: "Male names", data: maleNames },
  { heading: "Female names", data: femaleNames },
  { heading: "Male nicknames", data: maleNicknames },
  { heading: "Female nicknames", data: femaleNicknames },
];
const occupationRows = readTable("docs/tables/professions.md");

describe("tables", () => {
  it("covers 1-100 exactly once", () => {
    expect(coverageProblems(occupationRows.flatMap((row) => row.rolls))).toEqual([]);
    expect(coverageProblems(occupationTable.flatMap((row) => range(row.from, row.to)))).toEqual([]);
    for (const { heading, data } of nameTables) {
      expect(coverageProblems(readTable(namesPath, heading).flatMap((row) => row.rolls))).toEqual(
        [],
      );
      expect(data).toHaveLength(100);
    }
  });

  it("reports a hole and a duplicate", () => {
    const rows = parseTable("| 1 | a |\n| 2-3 | b |\n| 3 | c |\n| 5-100 | d |");
    expect(coverageProblems(rows.flatMap((row) => row.rolls))).toEqual([
      "duplicate 3",
      "missing 4",
    ]);
  });

  it("transcribed rows match the source", () => {
    expect(occupationRows).toHaveLength(79);
    expect(occupationTable).toHaveLength(79);
    occupationRows.forEach((source, index) => {
      const row = occupationTable[index];
      expect(row?.from).toBe(source.rolls[0]);
      expect(row?.to).toBe(source.rolls.at(-1));
      expect([row?.name, row?.weapon, row?.tradeGoods]).toEqual(source.cells);
    });
    for (const { heading, data } of nameTables) {
      const source = readTable(namesPath, heading);
      expect(data).toEqual(source.map((row) => row.cells[0]));
    }
  });
});

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

describe("description tables", () => {
  const sets = [
    { heading: "Male Set", data: descriptionTables.male },
    { heading: "Female Set", data: descriptionTables.female },
  ];

  it("description tables match the source", () => {
    for (const { heading, data } of sets) {
      const source = readCategories("docs/tables/descriptions.md", heading);
      expect(source, heading).toHaveLength(10);
      expect(data, heading).toHaveLength(10);
      source.forEach((category, i) => {
        expect(category.rolls, category.name).toEqual(range(1, 20));
        expect(new Set(category.features).size, category.name).toBe(20);
        expect(data[i]?.name).toBe(category.name);
        expect(data[i]?.features.map((f) => f.text)).toEqual(category.features);
        expect(data[i]?.features.map((f) => f.implies ?? "")).toEqual(category.implies);
      });
    }
  });

  it("reports a repeated feature in a category", () => {
    const markdown = `\n### Male 1. Hair\n\n| d20 | Feature |\n| --- | --- |\n| 1 | a |\n| 2 | a |\n`;
    const [category] = parseCategories(markdown);
    expect(duplicateFeatures(category?.features ?? [])).toEqual(["a"]);
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const forbidden = [
  'from "node:',
  'from "../adapters',
  'from "../../adapters',
  "Math.random",
  "Date.now",
  "new Date",
  "performance.now",
  "process.",
];

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

function deepDomainImports(source: string): string[] {
  const imports = [...source.matchAll(/from "([^"]*domain[^"]*)"/g)].map((m) => m[1] ?? "");
  return imports.filter((path) => path !== "../../domain/index.js");
}

describe("architecture", () => {
  it("keeps the domain free of adapters, Node APIs, the clock and Math.random", () => {
    const files = tsFiles("src/domain");
    expect(files.length).toBeGreaterThan(0);
    const hits = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return forbidden.filter((needle) => source.includes(needle)).map((n) => `${file}: ${n}`);
    });
    expect(hits).toEqual([]);
  });

  it("keeps the CLI to the domain barrel", () => {
    const files = tsFiles("src/adapters/cli");
    expect(files.length).toBeGreaterThan(0);
    const deep = files.flatMap((file) =>
      deepDomainImports(readFileSync(file, "utf8")).map((path) => `${file}: ${path}`),
    );
    expect(deep).toEqual([]);
    const domainNamesCli = tsFiles("src/domain").filter((file) =>
      readFileSync(file, "utf8").includes("adapters/cli"),
    );
    expect(domainNamesCli).toEqual([]);
  });

  it("detects a deep domain import", () => {
    expect(deepDomainImports('import { x } from "../../domain/zero.js";')).toEqual([
      "../../domain/zero.js",
    ]);
    expect(deepDomainImports('import { x } from "../../domain/index.js";')).toEqual([]);
  });
});

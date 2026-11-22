import { describe, expect, it } from "vitest";
import { run } from "../src/adapters/cli/run.js";

describe("run", () => {
  it("uses the injected random seed", () => {
    let out = "";
    const code = run(["roll"], {
      stdout: (text) => {
        out += text;
      },
      stderr: () => {},
      randomSeed: () => 42,
    });
    expect(code).toBe(0);
    expect(out.startsWith("Seed: 42\n")).toBe(true);
  });
});

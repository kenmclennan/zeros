#!/usr/bin/env node
import { randomInt } from "node:crypto";
import { run } from "./run.js";

process.exitCode = run(process.argv.slice(2), {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  randomSeed: () => randomInt(0, 4294967296),
});

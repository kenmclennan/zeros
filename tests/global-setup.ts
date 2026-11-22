import { execSync } from "node:child_process";

export default function setup(): void {
  try {
    execSync("npm run build", { stdio: "pipe" });
  } catch (error) {
    const failure = error as { stdout?: Buffer; stderr?: Buffer };
    throw new Error(`build failed:\n${failure.stdout?.toString()}\n${failure.stderr?.toString()}`);
  }
}

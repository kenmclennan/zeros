import { globSync, readFileSync } from "node:fs";
import { lint } from "markdownlint/promise";

const config = JSON.parse(readFileSync(new URL("../.markdownlint.json", import.meta.url), "utf8"));
const files = globSync("**/*.md", {
  exclude: (p) => p.includes("node_modules") || p.includes("/dist"),
});
const results = await lint({ files, config });
let count = 0;
for (const [file, errors] of Object.entries(results)) {
  for (const e of errors) {
    count++;
    console.log(
      `${file}:${e.lineNumber} ${e.ruleNames.join("/")} ${e.ruleDescription}${e.errorDetail ? ` [${e.errorDetail}]` : ""}`,
    );
  }
}
console.log(`markdownlint: ${count} issue${count === 1 ? "" : "s"} in ${files.length} files`);
process.exit(count > 0 ? 1 : 0);

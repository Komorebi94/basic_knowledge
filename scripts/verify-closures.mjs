import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Only repository-authored tutorial snippets run here, never reader submissions.
const source = await readFile(new URL("../src/content/knowledge/closures.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
runInNewContext(compiled, { exports }, { timeout: 1000 });
let checked = 0;
for (const section of exports.closureArticle.sections) {
  for (const example of section.examples ?? []) {
    const output = [];
    runInNewContext(example.code, {
      console: { log: (...values) => output.push(values.map(String).join(" ")) },
      EventTarget, Event,
    }, { timeout: 1000, microtaskMode: "afterEvaluate" });
    assert.deepEqual(output, Array.from(example.expectedOutput), `Unexpected output in ${section.id}`);
    checked += 1;
  }
}
console.log(`Verified ${checked} tutorial examples, including TDZ errors, loop bindings, microtasks and listener cleanup.`);

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { chromium } from "playwright";
import ts from "typescript";
import { startArticleFixture } from "./lib/article-fixture.mjs";

// Run reviewed article examples in isolated blank pages or a disposable origin fixture.
// Reader submissions and imported backups never enter this verifier.
// language "module" runs as an ES module so top-level await and live bindings are real.
const articles = [];
for (const directory of ["knowledge", "ai"]) {
  const root = new URL(`../src/content/${directory}/`, import.meta.url);
  for (const file of await readdir(root)) {
    if (!file.endsWith(".ts")) continue;
    const source = await readFile(new URL(file, root), "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exports = {};
    runInNewContext(compiled, { exports }, { timeout: 1000 });
    articles.push(...Object.values(exports));
  }
}

const temp = await mkdtemp(join(tmpdir(), "zhixu-article-examples-"));
const requestedIds = (process.env.ZHIXU_ARTICLE_IDS ?? "").split(",").filter(Boolean);
// Origin-dependent browser lessons use an isolated loopback fixture, never the main site.
let exampleOrigin = process.env.ZHIXU_ARTICLE_ORIGIN;
if (exampleOrigin) {
  const url = new URL(exampleOrigin);
  assert(url.protocol === "http:" && url.hostname === "127.0.0.1", "Example origin must be an isolated loopback HTTP fixture");
}
for (const id of requestedIds) assert(articles.some(article => (article.catalogId ?? article.id) === id), `Unknown article ID: ${id}`);
const selectedArticles = requestedIds.length ? articles.filter(article => requestedIds.includes(article.catalogId ?? article.id)) : articles;
const needsOrigin = selectedArticles.some(article => ["K04-04", "K04-06", "K04-07"].includes(article.id));
const worker = articles.find(article => article.id === "K04-07")?.sections.find(section => section.id === "worker")?.code;
const offlinePage = articles.find(article => article.id === "K04-07")?.sections.find(section => section.id === "offline-page")?.code;
const fixture = !exampleOrigin && needsOrigin ? await startArticleFixture(worker, offlinePage) : undefined;
exampleOrigin ??= fixture?.origin;
const evidence = [];
let checked = 0;
let typed = 0;
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const article of selectedArticles) {
    for (const section of article.sections) {
      for (const example of section.examples ?? []) {
        const label = `${article.id}/${section.id}/${checked}`;
        console.log(`Checking ${label}`);
        let code = example.code;
        if (example.language === "typescript") {
          const file = join(temp, `example-${typed}.ts`);
          await writeFile(file, `${code}\nexport {};\n`);
          const program = ts.createProgram([file], {
            strict: true, noUncheckedIndexedAccess: true, noEmit: true,
            target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
            lib: ["lib.es2022.d.ts", "lib.dom.d.ts"], types: [],
          });
          const diagnostics = ts.getPreEmitDiagnostics(program);
          assert.equal(diagnostics.length, 0, `${label}: ${ts.formatDiagnostics(diagnostics, {
            getCanonicalFileName: (name) => name,
            getCurrentDirectory: () => temp,
            getNewLine: () => "\n",
          })}`);
          code = ts.transpileModule(code, {
            compilerOptions: { target: ts.ScriptTarget.ES2022 },
          }).outputText;
          typed += 1;
        }
        const page = await browser.newPage();
        if (exampleOrigin) await page.goto(exampleOrigin);
        const output = [];
        const errors = [];
        page.on("console", (message) => {
          if (message.type() === "log") output.push(message.text());
        });
        page.on("pageerror", (error) => errors.push(error.message));
        const completed = page.waitForEvent("console", {
          predicate: (message) => message.text() === "__zhixu_example_complete__", timeout: 5000,
        });
        if (example.language === "module") {
          await page.addScriptTag({ type: "module", content: `${code}\nconsole.log('__zhixu_example_complete__');` });
        } else {
          await page.addScriptTag({ content: `${code}\nsetTimeout(() => console.log('__zhixu_example_complete__'), 0);` });
        }
        try {
          await completed;
        } catch (error) {
          throw new Error(`${label}: example did not complete; browser errors: ${errors.join("; ") || "none"}`, { cause: error });
        }
        assert.deepEqual(errors, [], `${label}: unexpected browser error`);
        assert.deepEqual(output.filter((line) => line !== "__zhixu_example_complete__"), Array.from(example.expectedOutput), label);
        evidence.push({ articleId: article.catalogId ?? article.id, sectionId: section.id, language: example.language ?? "javascript", codeSha256: createHash("sha256").update(example.code).digest("hex"), output: output.filter(line => line !== "__zhixu_example_complete__"), passed: true });
        await page.close();
        checked += 1;
      }
    }
  }
  const report = process.env.ZHIXU_ARTICLE_REPORT ?? "article-examples-report.json";
  assert(/^[a-z0-9-]+\.json$/.test(report), "Report must be a JSON filename");
  await writeFile(new URL(`../docs/verification/${report}`, import.meta.url), JSON.stringify({ verifiedAt: new Date().toISOString(), browser: browser.version(), articleIds: selectedArticles.map(article => article.catalogId ?? article.id), examples: checked, strictTypeScriptExamples: typed, evidence, limitations: ["Only author-maintained examples; no model API or live backend validation"] }, null, 2) + "\n");
  console.log(`Verified ${selectedArticles.length} articles / ${checked} browser examples / ${typed} strict TypeScript examples.`);
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp, { recursive: true, force: true });
}

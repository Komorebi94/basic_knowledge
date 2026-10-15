import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Only load reviewed, local content modules. This is a build check, not a user-code runner.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
function load(file) {
  let path = file;
  if (!extname(path)) path = existsSync(`${path}.ts`) ? `${path}.ts` : resolve(path, "index.ts");
  if (cache.has(path)) return cache.get(path);
  if (path.endsWith(".json")) return JSON.parse(readFileSync(path, "utf8"));
  assert((path.startsWith(resolve(root, "src/content") + "/") || path === resolve(root, "src/features/knowledge/catalog.ts")), `Untrusted content import: ${path}`);
  const exports = {};
  cache.set(path, exports);
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(compiled, {
    exports, URL,
    require: (specifier) => {
      assert(specifier.startsWith("."), `External content import: ${specifier}`);
      return load(resolve(dirname(path), specifier));
    },
  }, { timeout: 2000, filename: path });
  return exports;
}

function writeIfChanged(path, text) {
  if (existsSync(path) && readFileSync(path, "utf8") === text) return false;
  writeFileSync(path, text);
  return true;
}

export function generatePublicMetadata() {
  const { articles, articleHref } = load(resolve(root, "src/content/articles.ts"));
  const { exercises } = load(resolve(root, "src/content/practice/index.ts"));
  const metadata = {
    articles: articles.map(({id,catalogId,kind,title,summary,domainSlug,slug,estimatedMinutes,revision = 1}) => ({id,catalogId:catalogId ?? id,kind,title,summary,domainSlug,slug,estimatedMinutes,revision,href:articleHref({kind,domainSlug,slug})})),
    exercises: exercises.map(({id,title,slug,revision}) => ({id,title,slug,revision,href:`/practice/${slug}`})),
  };
  writeIfChanged(resolve(root,"src/content/publicMetadata.json"), JSON.stringify(metadata,null,2)+"\n");
  writeIfChanged(resolve(root,"src/content/exerciseMetadata.json"), JSON.stringify(exercises.map(({id,title,slug,summary,revision,estimatedMinutes,updatedAt,verifiedAt,knowledgeIds,problem,entryContract}) => ({id,title,slug,summary,revision,estimatedMinutes,updatedAt,verifiedAt,knowledgeIds,problem,entryContract})),null,2)+"\n");
  const { publicSearchDocuments } = load(resolve(root, "src/content/searchDocuments.ts"));
  const searchIndex = JSON.stringify(publicSearchDocuments);
  writeIfChanged(resolve(root, "src/content/searchIndex.json"), searchIndex);
  console.log(`Generated ${metadata.articles.length} article + ${metadata.exercises.length} exercise summaries and ${publicSearchDocuments.length} search documents.`);
  return { articles: metadata.articles.length, exercises: metadata.exercises.length, searchDocuments: publicSearchDocuments.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generatePublicMetadata();
}

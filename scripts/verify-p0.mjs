import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
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

const { articles, articleHref } = load(resolve(root, "src/content/articles.ts"));
const { knowledgeTopics, aiTopics, exerciseTopics } = load(resolve(root, "src/content/catalog.ts"));
const { exercises } = load(resolve(root, "src/content/practice/index.ts"));
const { recallCards, reviewCases, p0KnowledgeIds, p0AiIds, p1AiIds } = load(resolve(root, "src/content/learningContent.ts"));
const { contentManifest } = load(resolve(root, "src/content/manifest.ts"));
const { aiContentContracts } = load(resolve(root, "src/content/aiContracts.ts"));
const { publicSearchDocuments } = load(resolve(root, "src/content/searchDocuments.ts"));
const allCatalogIds = new Set([...knowledgeTopics, ...aiTopics, ...exerciseTopics].map((topic) => topic.id));
const articleById = new Map(articles.map((article) => [article.catalogId ?? article.id, article]));
assert.equal(articleById.size, articles.length, "Article catalog IDs must be unique");
assert.equal(new Set(articles.map((article) => article.id)).size, articles.length, "Persistent IDs must be unique");
assert.equal(new Set(articles.map(articleHref)).size, articles.length, "Article routes must be unique");
assert.equal(p0KnowledgeIds.length, 32);
assert.equal(p0AiIds.length, 16);
assert.equal(exercises.length, 24);
const p0Ids = [...p0KnowledgeIds, ...p0AiIds];
const browserP1Ids = knowledgeTopics.filter(topic => topic.domainId === "K04" && !p0KnowledgeIds.includes(topic.id)).map(topic => topic.id);
assert.equal(browserP1Ids.length, 6);
const typescriptP1Ids = knowledgeTopics.filter(topic => topic.domainId === "K03" && !p0KnowledgeIds.includes(topic.id)).map(topic => topic.id);
assert.equal(typescriptP1Ids.length, 6);
const htmlCssP1Ids = knowledgeTopics.filter(topic => topic.domainId === "K05" && !p0KnowledgeIds.includes(topic.id)).map(topic => topic.id);
assert.equal(htmlCssP1Ids.length, 6);
const networkingP1Ids = knowledgeTopics.filter(topic => topic.domainId === "K06" && !p0KnowledgeIds.includes(topic.id)).map(topic => topic.id);
assert.equal(networkingP1Ids.length, 6);
const reactP1Ids = knowledgeTopics.filter(topic => topic.domainId === "K07" && !p0KnowledgeIds.includes(topic.id)).map(topic => topic.id);
assert.equal(reactP1Ids.length, 6);
assert.equal(p1AiIds.length, 4);
for (const id of [...p0Ids, ...p1AiIds, ...browserP1Ids, ...typescriptP1Ids, ...htmlCssP1Ids, ...networkingP1Ids, ...reactP1Ids]) {
  const article = articleById.get(id);
  assert(article, `${id}: missing published article`);
  assert(article.sections.length >= 4, `${id}: incomplete body`);
  const headings = article.sections.map((section) => section.id);
  assert.equal(new Set(headings).size, headings.length, `${id}: duplicate anchors`);
  assert(headings.includes("problem"), `${id}: missing problem`);
  assert(article.sections.reduce((sum, section) => sum + (section.examples?.length ?? 0), 0) >= 2, `${id}: missing runnable examples`);
  const cards = recallCards.filter((card) => card.catalogId === id);
  assert(cards.length >= 2 && cards.length <= 5, `${id}: needs 2–5 recall cards`);
}
assert.equal(new Set(recallCards.map((card) => card.cardId)).size, recallCards.length);
assert(recallCards.filter((card) => p0Ids.includes(card.catalogId)).length >= 96);
for (const card of recallCards) {
  const article = articleById.get(card.catalogId);
  assert(article && article.id === card.sourceContentId, `${card.cardId}: broken stable content identity`);
  assert(article.sections.some((section) => section.id === card.sourceHeadingId), `${card.cardId}: missing source heading ${card.sourceHeadingId}`);
  assert(card.question && card.answerPoints.length >= 2 && card.answerPoints.length <= 5 && card.pitfalls.length > 0, `${card.cardId}: incomplete card`);
}
for (let number = 1; number <= 24; number += 1) {
  const id = `E${String(number).padStart(2, "0")}`;
  const exercise = exercises.find((item) => item.id === id);
  assert(exercise, `${id}: missing P0 exercise`);
  assert.equal(exercise.examples.length, 3, `${id}: needs 3 examples`);
  assert(exercise.testCases.length >= 6, `${id}: missing boundary tests`);
  assert.equal(exercise.hints.length, 3, `${id}: needs 3 hints`);
  assert(exercise.referenceArtifact && exercise.starterArtifact && exercise.entryContract && exercise.explanation.length >= 2 && exercise.alternative && exercise.complexity, `${id}: incomplete exercise`);
  assert(exercise.wrongImplementations.length >= 2, `${id}: missing mutation checks`);
  for (const related of exercise.knowledgeIds) assert(articleById.has(related), `${id}: linked knowledge is unreadable: ${related}`);
}
for (const id of ["AI07", "AI08", "AI09", "AI11"]) {
  assert(articleById.get(id).sections.some((section) => section.code?.includes("【")), `${id}: missing task template`);
}
assert.equal(aiContentContracts.length, 20);
for (const contract of aiContentContracts) {
  assert(contract.scenario && contract.requiredInputs.length > 0 && contract.guardrails.length > 0 && contract.verificationChecklist.length > 0 && contract.failurePatterns.length > 0 && contract.evidenceArtifacts.length > 0 && contract.toolScope, `${contract.catalogId}: incomplete AI contract`);
}
for (const id of p1AiIds) {
  const article = articleById.get(id);
  const contract = aiContentContracts.find(item => item.catalogId === id);
  assert(contract.taskTemplate?.includes("【"), `${id}: missing fillable task template`);
  for (const section of article.sections) {
    for (const example of section.examples ?? []) {
      assert(example.code && example.expectedOutput.length > 0 && example.explanation.length >= 2, `${id}/${section.id}: incomplete executable explanation`);
    }
  }
  const doc = publicSearchDocuments.find(item => item.id === id);
  assert(doc?.availability === "readable" && doc.href === articleHref(article) && doc.body.includes(article.sections[0].paragraphs[0]), `${id}: new tutorial not indexed`);
}
for (const id of ["AI09", "AI10", "AI15"]) {
  const item = reviewCases.find((reviewCase) => reviewCase.catalogId === id);
  assert(item?.excerpt && item.questions.length >= 2 && item.findings.length >= 2 && item.rubric.length >= 2, `${id}: incomplete review case`);
}
for (const record of contentManifest) {
  assert(allCatalogIds.has(record.catalogId), `${record.id}: missing catalog`);
  assert(record.title && record.summary && /^[a-z0-9-]+$/.test(record.slug), `${record.id}: missing public metadata`);
  assert(record.status === "published" && Number.isSafeInteger(record.revision) && record.revision > 0);
  assert(Number.isSafeInteger(record.estimatedMinutes) && record.estimatedMinutes >= 1 && record.estimatedMinutes <= 120);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(record.updatedAt) && /^\d{4}-\d{2}-\d{2}$/.test(record.verifiedAt));
  assert(record.sources.length > 0 && record.applicableVersions.length > 0);
  for (const source of record.sources) {
    const url = new URL(source.url);
    assert(url.protocol === "https:" && !url.username && !url.password, `${record.id}: unsafe source URL`);
    assert(source.publisher && source.claimScope && source.checkedAt);
  }
  for (const id of [...record.prerequisites, ...record.relatedIds]) {
    assert(allCatalogIds.has(id) && id !== record.catalogId, `${record.id}: broken content relation ${id}`);
  }
}
assert.equal(contentManifest.length, articles.length + exercises.length);
assert.equal(new Set(contentManifest.map((record) => record.id)).size, contentManifest.length);
assert.equal(publicSearchDocuments.length, 204);
assert.equal(new Set(publicSearchDocuments.map((document) => document.id)).size, 204);
for (const exercise of exercises) {
  const document = publicSearchDocuments.find((item) => item.id === exercise.id);
  assert.equal(document.href, `/practice/${exercise.slug}`);
  assert(!document.body.includes(exercise.referenceArtifact), `${exercise.id}: search exposes folded answer`);
}
for (const article of articles) {
  const visible = JSON.stringify([article.title, article.summary, article.sections]);
  assert(!visible.includes("面试"), `${article.id}: forbidden publication wording`);
}
const metadata = load(resolve(root,"src/content/publicMetadata.json"));
assert.equal(JSON.stringify(metadata.articles), JSON.stringify(articles.map(({id,catalogId,kind,title,summary,domainSlug,slug,estimatedMinutes}) => ({id,catalogId:catalogId ?? id,kind,title,summary,domainSlug,slug,estimatedMinutes,href:articleHref({kind,domainSlug,slug})}))),"Generated article summaries are stale");
const exerciseMetadata = load(resolve(root,"src/content/exerciseMetadata.json"));
assert.equal(JSON.stringify(exerciseMetadata),JSON.stringify(exercises.map(({id,title,slug,summary,revision,estimatedMinutes,updatedAt,verifiedAt,knowledgeIds,problem,entryContract}) => ({id,title,slug,summary,revision,estimatedMinutes,updatedAt,verifiedAt,knowledgeIds,problem,entryContract}))),"Generated exercise summaries are stale");
assert(exerciseMetadata.every((entry) => !("referenceArtifact" in entry) && !("hints" in entry)),"Reading summaries must not load practice answers");
console.log(`Published content verified: P0 ${p0KnowledgeIds.length} knowledge + ${p0AiIds.length} AI + ${exercises.length} exercises; P1 ${browserP1Ids.length + typescriptP1Ids.length + htmlCssP1Ids.length + networkingP1Ids.length + reactP1Ids.length} K03–K07 knowledge + ${p1AiIds.length} AI; ${recallCards.length} cards (${recallCards.filter((card) => p0Ids.includes(card.catalogId)).length} P0); ${aiContentContracts.filter(contract => contract.taskTemplate).length} templates; ${reviewCases.length} cases; 204 unique search documents.`);

import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Reviewed repository content only. Never accepts reader submissions or backups.
const baseline = process.env.ZHIXU_CONTENT_BASELINE === '1';
async function load(file) {
  const source = baseline ? execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' }) : await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const exports = {};
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports }, { timeout: 1000 });
  return Object.values(exports).flat();
}
const articles = [];
for (const directory of ['knowledge', 'ai']) {
  for (const file of await readdir(new URL(`../src/content/${directory}/`, import.meta.url))) {
    if (file.endsWith('.ts')) articles.push(...await load(`src/content/${directory}/${file}`));
  }
}
const exercises = (await Promise.all(['async', 'data', 'functions', 'p1'].map(group => load(`src/content/practice/${group}.ts`)))).flat();
const byId = id => exercises.find(exercise => exercise.id === id);
const evaluate = code => runInNewContext(code, { console: { log() {} } }, { timeout: 1000 });
const results = [];
async function check(name, test) {
  try { await test(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}

for (const section of articles.find(article => article.id === 'K02-04').sections) {
  for (const example of section.examples ?? []) {
    if (!example.code.includes('function createLimiter')) continue;
    const tree = ts.createSourceFile('author.js', example.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const declaration = tree.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'createLimiter');
    const source = declaration.getText(tree);
    await check(`F01 ${section.id}: sync throw releases slot and ordinary value completes`, async () => {
      const schedule = evaluate(source + ';createLimiter(1)');
      await schedule(() => { throw new Error('sync'); }).catch(() => {});
      let value;
      schedule(() => 7).then(result => { value = result; }, () => {});
      for (let index = 0; index < 32; index++) await Promise.resolve();
      assert.equal(value, 7);
    });
    await check(`F01 ${section.id}: invalid limit rejected`, () => {
      assert.throws(() => evaluate(source + ';createLimiter(0)'), error => error.name === 'RangeError');
    });
  }
}

await check('F02 E37: all CRLF split positions, character chunks and empty event type', () => {
  const source = byId('E37').referenceArtifact;
  const make = () => evaluate(source + ';createSse()');
  const text = 'event: note\r\n: comment\r\ndata: 甲\r\ndata: 乙\r\n\r\nevent:\ndata:\n\n';
  const expected = [{ event: 'note', data: '甲\n乙' }, { event: 'message', data: '' }];
  const compare = actual => assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  for (let cut = 0; cut <= text.length; cut++) {
    const parser = make();
    compare([...parser.push(text.slice(0, cut)), ...parser.push(text.slice(cut))]);
  }
  const parser = make();
  compare(text.split('').flatMap(char => Array.from(parser.push(char))));
  assert.equal(make().push('data: incomplete\n').length, 0);
});
await check('F03 E33: special own keys never change result prototype', () => {
  const result = evaluate(byId('E33').referenceArtifact + `;
    const source = JSON.parse('{"__proto__":{"injected":true},"constructor":1}');
    [pick(source, ['__proto__', 'constructor']), readonlyCopy(source)].every(copy =>
      Object.hasOwn(copy, '__proto__') && Object.getPrototypeOf(copy) === Object.prototype && copy.injected === undefined && copy.constructor === 1);`);
  assert.equal(result, true);
});
await check('F04 E33: nested thenable and throwing getter use Promise semantics', async () => {
  const unwrap = evaluate(byId('E33').referenceArtifact + ';unwrap');
  assert.equal(await unwrap({ then(resolve) { resolve({ then(done) { done(42); } }); } }), 42);
  const result = unwrap({ get then() { throw new TypeError('getter'); } });
  await assert.rejects(result, { name: 'TypeError' });
  let reads = 0;
  assert.equal(await unwrap({ get then() { reads++; return done => done(7); } }), 7);
  assert.equal(reads, 1);
});
await check('F05 K06-06: EOF cannot dispatch an incomplete event', () => {
  const source = articles.find(article => article.id === 'K06-06').sections.find(section => section.id === 'frames').examples[0].code;
  const parse = evaluate(source + ';parseSse');
  assert.equal(parse('data: partial'), '');
  assert.equal(parse('data: partial\n'), '');
  assert.equal(parse('data: full\r\n\r\n'), '-:full');
});
await check('F11: published exercises are not described as unavailable', () => {
  for (const article of articles) {
    for (const section of article.sections) {
      for (const paragraph of section.paragraphs) {
        if (/E\d{2}/.test(paragraph)) assert(!/尚未制作|仍未制作|尚未交付|尚未开放|仍未开放|尚未提供可运行|尚未做成可运行|均尚未开放|仍待制作|仍待交付|仍待编写/.test(paragraph), `${article.id}/${section.id}: ${paragraph}`);
        if (exercises.some(exercise => exercise.knowledgeIds.includes(article.catalogId ?? article.id))) {
          assert(!/本主题没有已开放的独立练习|本主题暂无已交付的独立编码题/.test(paragraph), `${article.id}/${section.id}: unavailable linked exercise`);
        }
      }
    }
  }
});

const report = { verifiedAt: new Date().toISOString(), baseline, node: process.version, results };
await writeFile(new URL(`../docs/verification/content-corrections-${baseline ? 'baseline' : 'regressions'}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ': ' + result.error : ''}`);
if (results.some(result => !result.passed)) process.exitCode = 1;

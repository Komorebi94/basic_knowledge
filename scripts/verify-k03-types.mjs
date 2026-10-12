import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const checks = JSON.parse(await readFile(new URL('../src/content/knowledge/typescript-p1-checks.json', import.meta.url), 'utf8'));
assert.equal(ts.version, checks.compilerVersion, 'Update lesson evidence when compiler changes');
const articles = new Map();
for (const file of ['generics-and-constraints', 'conditional-and-mapped-types', 'function-types-variance', 'utility-and-domain-types', 'declarations-public-libraries', 'maintainable-complex-types']) {
  const source = await readFile(new URL(`../src/content/knowledge/${file}.ts`, import.meta.url), 'utf8');
  const exports = {};
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports }, { timeout: 1000 });
  for (const article of Object.values(exports)) articles.set(article.id, article);
}
const temp = await mkdtemp(join(tmpdir(), 'zhixu-k03-types-'));
const report = { verifiedAt: new Date().toISOString(), compiler: ts.version, negativeChecks: [], packageChecks: [], limitations: ['Current installed compiler and Node only; no historical compiler matrix', 'Only author-maintained code; no reader submissions'] };
const options = {
  strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true,
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], types: [], noEmit: true, skipLibCheck: false,
};
function diagnostics(files, overrides = {}) {
  const program = ts.createProgram(files, { ...options, ...overrides });
  return { program, errors: ts.getPreEmitDiagnostics(program).filter(error => error.category === ts.DiagnosticCategory.Error) };
}
const hash = source => createHash('sha256').update(source).digest('hex');
function noErrors(errors, label) {
  assert.equal(errors.length, 0, `${label}: ${ts.formatDiagnostics(errors, { getCanonicalFileName: file => file, getCurrentDirectory: () => temp, getNewLine: () => '\n' })}`);
}
async function runNode(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], { cwd: temp, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; let errors = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { errors += chunk; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve(output.trim()) : reject(new Error(errors)));
  });
}
try {
  for (const check of checks.negativeChecks) {
    const code = articles.get(check.articleId).sections.find(section => section.id === check.sectionId).code;
    const file = join(temp, `${check.articleId}-${check.sectionId}.ts`);
    await writeFile(file, code + '\nexport {};\n');
    const { errors } = diagnostics([file]);
    const actualCodes = errors.map(error => error.code).sort((a, b) => a - b);
    assert.deepEqual(actualCodes, [...check.expectedDiagnosticCodes].sort((a, b) => a - b), `${check.articleId}/${check.sectionId}`);
    report.negativeChecks.push({ ...check, actualDiagnosticCodes: actualCodes, codeSha256: hash(code), passed: true });
    console.log(`Rejected ${check.articleId}/${check.sectionId}: ${actualCodes.join(',')}`);
  }
  const article = articles.get(checks.packageArticleId);
  const source = article.sections.find(section => section.id === checks.packageSourceSection).code;
  const manifest = article.sections.find(section => section.id === checks.packageManifestSection).code;
  const packageRoot = join(temp, 'node_modules', 'lesson-offset');
  const dist = join(packageRoot, 'dist');
  await mkdir(dist, { recursive: true });
  await mkdir(join(packageRoot, 'src'));
  await writeFile(join(packageRoot, 'package.json'), manifest);
  const sourceFile = join(packageRoot, 'src', 'index.ts');
  await writeFile(sourceFile, source);
  const { program, errors } = diagnostics([sourceFile], { noEmit: false, declaration: true, emitDeclarationOnly: true, outDir: dist });
  noErrors(errors, 'library declaration emit');
  const emitted = program.emit();
  noErrors(emitted.diagnostics, 'declaration emit');
  const declaration = await readFile(join(dist, 'index.d.ts'), 'utf8');
  for (const [mode, extension, declarationExtension] of [[ts.ModuleKind.ESNext, 'mjs', 'd.mts'], [ts.ModuleKind.CommonJS, 'cjs', 'd.cts']]) {
    await writeFile(join(dist, `index.${extension}`), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: mode } }).outputText);
    await writeFile(join(dist, `index.${declarationExtension}`), declaration);
  }
  const consumer = article.sections.find(section => section.id === checks.packageConsumerSection).code;
  for (const extension of ['mts', 'cts', 'ts']) {
    const file = join(temp, `consumer.${extension}`);
    await writeFile(file, consumer);
    const config = extension === 'ts' ? {} : { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, noEmit: false, outDir: join(temp, 'out') };
    const result = diagnostics([file], config);
    noErrors(result.errors, `consumer ${extension}`);
    if (extension !== 'ts') {
      noErrors(result.program.emit().diagnostics, `consumer emit ${extension}`);
      assert.equal(await runNode(join(temp, 'out', `consumer.${extension === 'mts' ? 'mjs' : 'cjs'}`)), '7\ntrue');
    }
    report.packageChecks.push({ mode: extension === 'ts' ? 'Bundler / ESNext' : `NodeNext / ${extension === 'mts' ? 'ESM' : 'CommonJS'}`, passed: true, runtimeOutput: extension === 'ts' ? null : ['7', 'true'] });
  }
  // A drifted declaration must fail at the consumer's number assignment.
  assert(declaration.includes('): number;'), 'expected generated return signature');
  await writeFile(join(dist, 'index.d.mts'), declaration.replace('): number;', '): string;'));
  const drift = diagnostics([join(temp, 'consumer.mts')], { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext });
  assert.deepEqual(drift.errors.map(error => error.code), [2322], 'consumer detects wrong declaration return');
  report.packageChecks.push({ mode: 'Mutated declaration return type', diagnosticCodes: [2322], passed: true });
  report.packageSourceSha256 = hash(source);
  report.packageManifestSha256 = hash(manifest);
  report.packageConsumerSha256 = hash(consumer);
  await writeFile(new URL('../docs/verification/k03-types-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log('K03 negative types and real package consumers passed.');
} finally { await rm(temp, { recursive: true, force: true }); }

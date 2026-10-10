import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const cache=new Map();
function load(path){if(!path.endsWith('.ts'))path+='.ts';if(cache.has(path))return cache.get(path);const exports={};cache.set(path,exports);vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:specifier=>load(resolve(dirname(path),specifier)),Intl,Date},{timeout:2000});return exports}
const personal=load(resolve('src/domain/personalLearning.ts'));
const original=personal.emptyPersonalLearningState();assert(personal.isPersonalLearningState(original));
for(const update of [{bodySize:['large']},{dailyLimit:'20'},{runShortcut:1},{studyTimezone:'Not/AZone'},{lastExportAt:'yesterday'}])assert.equal(personal.isPersonalLearningState({...original,preferences:{...original.preferences,...update}}),false);
assert.equal(personal.isPersonalLearningState({...original,bookmarks:JSON.parse('{"__proto__":{"contentId":"__proto__","titleSnapshot":"x","createdAt":"2026-10-09T00:00:00.000Z"}}')}),false);
assert.equal(Object.hasOwn(personal.normalizePersonalLearningState({...original,extra:'not retained'}),'extra'),false);
console.log('Personal domain verified: empty state, invalid enums/IDs/timezones, and whitelist normalization.');

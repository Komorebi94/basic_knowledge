import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const cache=new Map();
function load(path){if(!path.endsWith('.ts'))path+='.ts';if(cache.has(path))return cache.get(path);const exports={};cache.set(path,exports);vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:specifier=>load(resolve(dirname(path),specifier)),Intl,Date},{timeout:2000});return exports}
const personal=load(resolve('src/domain/personalLearning.ts'));
const {weeklyReviewStats}=load(resolve('src/domain/learningStats.ts'));
const original=personal.emptyPersonalLearningState();assert(personal.isPersonalLearningState(original));
for(const update of [{bodySize:['large']},{dailyLimit:'20'},{runShortcut:1},{studyTimezone:'Not/AZone'},{lastExportAt:'yesterday'}])assert.equal(personal.isPersonalLearningState({...original,preferences:{...original.preferences,...update}}),false);
const now='2026-10-09T00:00:00.000Z';
const reading=personal.recordReading(original,'K01-02',{scrollOffset:2400},now);assert.equal(reading.readings['K01-02'].status,'in-progress');assert.equal(original.readings['K01-02'],undefined);
const read=personal.recordReading(reading,'K01-02',{status:'read'},now);assert.equal(read.readings['K01-02'].scrollOffset,2400);
assert.equal(personal.isPersonalLearningState({...read,readings:{...read.readings,'K01-02':{...read.readings['K01-02'],status:['read']}}}),false);
let saved=personal.toggleBookmark(original,'K01-02','闭包',now);assert.equal(Object.keys(saved.bookmarks).length,1);saved=personal.toggleBookmark(saved,'K01-02','闭包',now);assert.equal(Object.keys(saved.bookmarks).length,0);
assert.equal(personal.isPersonalLearningState({...original,bookmarks:JSON.parse('{"__proto__":{"contentId":"__proto__","titleSnapshot":"x","createdAt":"2026-10-09T00:00:00.000Z"}}')}),false);
assert.equal(Object.hasOwn(personal.normalizePersonalLearningState({...original,extra:'not retained'}),'extra'),false);
const events=[
 {cardId:'a',occurredAt:'2026-10-04T15:01:00.000Z',revertedAt:null},
 {cardId:'a',occurredAt:'2026-10-05T00:00:00.000Z',revertedAt:null},
 {cardId:'b',occurredAt:'2026-10-07T00:00:00.000Z',revertedAt:'2026-10-07T01:00:00.000Z'},
 {cardId:'c',occurredAt:'2026-10-10T00:00:00.000Z',revertedAt:null},
];
const tokyo=weeklyReviewStats(events,'Asia/Tokyo',now);assert.equal(tokyo.startDate,'2026-10-05');assert.equal(tokyo.events,2);assert.equal(tokyo.cards,1);
const newYork=weeklyReviewStats(events,'America/New_York',now);assert.equal(newYork.events,0);
const dst=weeklyReviewStats([{cardId:'a',occurredAt:'2026-03-09T03:30:00.000Z',revertedAt:null},{cardId:'b',occurredAt:'2026-03-09T04:00:00.000Z',revertedAt:null}],'America/New_York','2026-03-10T12:00:00.000Z');assert.equal(dst.startDate,'2026-03-09');assert.equal(dst.events,1);
console.log('Personal domain verified: immutable readings, explicit read marker, bookmark toggle, invalid enums/IDs/timezones, whitelist, local-week/DST/reverted/future statistics.');

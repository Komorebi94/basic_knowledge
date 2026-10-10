import { readFile, mkdir, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import { deepStrictEqual } from 'node:assert';
import { inspect } from 'node:util';
import { createHash } from 'node:crypto';
import ts from 'typescript';

// Author-controlled exercise sources only. This is not a user code execution service.
const exercises = [];
for (const group of ['async', 'data', 'functions']) {
  const source = await readFile(new URL(`../src/content/practice/${group}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  const module = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  exercises.push(...module[`${group}Exercises`]);
}
exercises.sort((a,b) => a.id.localeCompare(b.id));
const unhandled = [];
process.on('unhandledRejection', reason => unhandled.push(reason));
const bootstrap = `
'use strict';
function assert(condition,message='Assertion failed') { if (!condition) throw new Error(message); }
function deferred() { let resolve,reject; const promise=new Promise((a,b)=>{resolve=a;reject=b}); return {promise,resolve,reject}; }
async function flush() { for (let i=0;i<32;i++) await Promise.resolve(); }
function expectThrow(fn,name) { let caught=false; try{fn()}catch(e){caught=true;equal(e.name,name)} assert(caught,'Expected throw '+name); }
async function expectReject(p,name,identity) { let caught=false; try{await p}catch(e){caught=true;equal(e.name,name);if(identity!==undefined)assert(e===identity,'Error identity')} assert(caught,'Expected reject '+name); }
Date.now = () => clock.now;
`;

async function runCase(exercise, reference, test) {
  let now = 0, nextId = 1;
  const logs = [];
  const timers = new Map();
  const context = vm.createContext({
    AbortController, AbortSignal,
    console: { log: (...values) => logs.push(values.map(value => typeof value === "string" ? value : inspect(value, {depth:6,breakLength:Infinity})).join(" ")) },
    equal: (actual, expected) => deepStrictEqual(actual, expected),
    setTimeout(callback, ms) { const id=nextId++; timers.set(id,{callback,time:now+ms}); return id; },
    clearTimeout(id) { timers.delete(id); },
  }, { codeGeneration: { strings: false, wasm: false } });
  context.clock = {
    get now() { return now; },
    get size() { return timers.size; },
    async tick(ms) {
      const target=now+ms;
      let callbacks=0;
      await vm.runInContext('flush()',context);
      for (;;) {
        const due=[...timers.entries()].filter(([,timer])=>timer.time<=target).sort((a,b)=>a[1].time-b[1].time||a[0]-b[0])[0];
        if (!due) break;
        if (++callbacks>1000) throw new Error('Virtual timer loop exceeded');
        const [id,timer]=due; timers.delete(id); now=timer.time;
        context.timerCallback=timer.callback;
        vm.runInContext('timerCallback()',context,{timeout:100});
        await vm.runInContext('flush()',context);
      }
      now=target;
      await vm.runInContext('flush()',context);
    },
  };
  vm.runInContext(bootstrap+reference,context,{timeout:100});
  const before=unhandled.length;
  const result=vm.runInContext(`(async()=>{${test.code}\n})()`,context,{timeout:100});
  let guard;
  try {
    await Promise.race([result,new Promise((_,reject)=>{guard=setTimeout(()=>reject(new Error('Unsettled test promise')),250);})]);
    await new Promise(resolve=>setImmediate(resolve));
    if (unhandled.length>before) throw new Error(`Unhandled rejection: ${unhandled[before]}`);
    return logs;
  } finally { clearTimeout(guard); timers.clear(); }
}

const verifierSha256 = createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
const report = { verifierSha256, verifiedAt: new Date().toISOString(), runtime: process.version, exerciseCount: exercises.length, passedCases: 0, verifiedExamples: 0, rejectedWrongImplementations: 0, exercises: [] };
const failures=[];
for (const exercise of exercises) {
  const minimumCases = ["E08","E09","E10","E16","E17","E18","E19","E20","E21"].includes(exercise.id) ? 6 : 8;
  if (exercise.testCases.length < minimumCases || exercise.examples.length !== 3 || exercise.hints.length !== 3 || exercise.wrongImplementations.length < 2) throw new Error(`${exercise.id}: incomplete publication contract`);
  const contentSha256 = createHash("sha256").update(JSON.stringify(exercise)).digest("hex");
  const entry={id:exercise.id,revision:exercise.revision,contentSha256,cases:[],examples:[],wrongImplementations:[]};
  for (const [index,example] of exercise.examples.entries()) {
    try {
      const actualLogs=await runCase(exercise,exercise.referenceArtifact,{code:example.code});
      deepStrictEqual(actualLogs, example.expectedLogs);
      report.verifiedExamples++;
      entry.examples.push({index:index+1,expectedOutput:example.expectedOutput,actualLogs,result:"executed"});
    } catch(error) {
      failures.push(`${exercise.id} example ${index+1}: ${error.message}`);
      entry.examples.push({index:index+1,result:"fail",error:error.message});
    }
  }
  for (const test of exercise.testCases) {
    try { await runCase(exercise,exercise.referenceArtifact,test); report.passedCases++; entry.cases.push({id:test.id,result:'pass'}); }
    catch(error) { failures.push(`${exercise.id} ${test.id} ${test.name}: ${error.message}`); entry.cases.push({id:test.id,result:'fail',error:error.message}); }
  }
  for (const wrong of exercise.wrongImplementations) {
    // Syntax-invalid snippets cannot count as a behavioral mutation caught by tests.
    new vm.Script(wrong.code);
    let caught;
    for (const test of exercise.testCases) {
      try { await runCase(exercise,wrong.code,test); }
      catch(error) { caught={testId:test.id,error:error.message}; break; }
    }
    if (!caught) failures.push(`${exercise.id}: wrong implementation survived: ${wrong.name}`);
    else report.rejectedWrongImplementations++;
    entry.wrongImplementations.push({name:wrong.name,...caught,result:caught?'rejected':'survived'});
  }
  report.exercises.push(entry);
}
await mkdir(new URL('../docs/verification/',import.meta.url),{recursive:true});
await writeFile(new URL('../docs/verification/exercises.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
if (failures.length) { console.error(failures.join('\n')); process.exitCode=1; }
else console.log(`Verified ${report.exerciseCount} exercises, ${report.passedCases} behavior cases, ${report.verifiedExamples} examples; rejected ${report.rejectedWrongImplementations} wrong implementations. Report: docs/verification/exercises.json`);

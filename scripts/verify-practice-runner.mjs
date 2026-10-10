import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const origin=process.env.ZHIXU_MAIN_ORIGIN??'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(origin,{waitUntil:'domcontentloaded'});
 const report=await page.evaluate(async()=>{
  const {RunnerClient}=await import('/src/infrastructure/runner/client.ts');
  const {exercises}=await import('/src/content/practice/index.ts');
  const result={references:[],mutations:[],guards:[]};
  for(const exercise of exercises){
   const client=new RunnerClient();const run=code=>client.run({runId:crypto.randomUUID(),exercise,code,codeRevision:1});
   const reference=await run(exercise.referenceArtifact);result.references.push({id:exercise.id,status:reference.status,passed:reference.passed,total:reference.total,failures:reference.caseResults.filter(r=>!r.passed)});
   for(const wrong of exercise.wrongImplementations){const actual=await run(wrong.code);result.mutations.push({id:exercise.id,name:wrong.name,status:actual.status,passed:actual.passed,total:actual.total})}
  }
  const exercise=exercises[0];
  const looping=new RunnerClient();const timed=await looping.run({runId:crypto.randomUUID(),exercise,code:'while(true){}',codeRevision:2});result.guards.push({name:'infinite-loop',status:timed.status});
  const stopping=new RunnerClient(),pending=stopping.run({runId:crypto.randomUUID(),exercise,code:'while(true){}',codeRevision:3});setTimeout(()=>stopping.stop(),100);result.guards.push({name:'stop',status:(await pending).status});
  const rejected=await new RunnerClient().run({runId:crypto.randomUUID(),exercise,code:exercise.referenceArtifact+'\nPromise.reject(new Error("unhandled"));',codeRevision:4});result.guards.push({name:'unhandled-rejection',status:rejected.status});
  result.guards.push({name:'iframes-cleaned',value:document.querySelectorAll('iframe').length});
  return result;
 });
 for(const r of report.references){assert.equal(r.status,'passed',JSON.stringify(r));assert.equal(r.passed,r.total)}
 for(const r of report.mutations)assert.notEqual(r.status,'passed',JSON.stringify(r));
 assert.equal(report.references.length,24);assert.equal(report.mutations.length,48);
 assert.equal(report.guards[0].status,'timeout');assert.equal(report.guards[1].status,'stopped');assert.equal(report.guards[2].status,'failed');assert.equal(report.guards[3].value,0);
 await writeFile('docs/verification/practice-browser.json',JSON.stringify({verifiedAt:new Date().toISOString(),browser:browser.version(),...report},null,2)+'\n');
 console.log('Browser practice: 24 references passed, 48 wrong implementations rejected; independent timeout, stop and iframe cleanup passed.');
}finally{await browser.close()}

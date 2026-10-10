import { exercises } from '../src/content/practice/index.ts';
const parentOrigin=__PARENT_ORIGIN__,protocolVersion=1;let token=null,active=null;
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function send(message){window.parent.postMessage({...message,protocolVersion,token},parentOrigin)}
function stop(runId,status){if(!active||active.runId!==runId)return;const run=active;active=null;clearTimeout(run.timer);run.worker.terminate();send({type:'done',runId,codeRevision:run.codeRevision,status,passed:0,total:run.total})}
window.addEventListener('message',event=>{
  if(event.source!==window.parent||event.origin!==parentOrigin||!record(event.data))return;
  const m=event.data;if(m.protocolVersion!==protocolVersion)return;
  if(m.type==='init'){if(token!==null||typeof m.token!=='string'||m.token.length<24||m.token.length>200)return;token=m.token;send({type:'ready'});return}
  if(token===null||m.token!==token)return;
  if(m.type==='stop'){if(typeof m.runId==='string')stop(m.runId,'stopped');return}
  if(m.type!=='run'||active!==null)return;
  if(typeof m.runId!=='string'||!/^[\w-]{1,80}$/.test(m.runId)||typeof m.code!=='string'||m.code.length>100000||!Number.isInteger(m.timeoutMs)||m.timeoutMs<1||m.timeoutMs>5000){send({type:'error',runId:m.runId,reason:'invalid-run-request'});return}
  const exercise=m.exerciseId===undefined?undefined:exercises.find(e=>e.id===m.exerciseId&&e.revision===m.revision);
  if(m.exerciseId!==undefined&&(!exercise||!Number.isSafeInteger(m.codeRevision)||m.codeRevision<1)){send({type:'error',runId:m.runId,reason:'invalid-exercise'});return}
  let worker;try{worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'})}catch{send({type:'error',runId:m.runId,codeRevision:m.codeRevision,reason:'Worker无法启动'});return}
  const run={worker,runId:m.runId,codeRevision:m.codeRevision,total:exercise?.testCases.length??0,timer:setTimeout(()=>stop(m.runId,'timeout'),m.timeoutMs),bytes:0,cases:new Set(),lines:0};active=run;
  worker.addEventListener('message',event=>{
    if(active!==run||!record(event.data))return;const r=event.data;
    if(r.runId!==run.runId||r.codeRevision!==run.codeRevision)return;
    let size;try{size=new TextEncoder().encode(JSON.stringify(r)).length}catch{stop(run.runId,'error');return}run.bytes+=size;if(size>16384||run.bytes>262144){stop(run.runId,'error');return}
    if(r.type==='case-result'){
      if(!exercise||!exercise.testCases.some(t=>t.id===r.caseId)||run.cases.has(r.caseId)||typeof r.passed!=='boolean'||typeof r.message!=='string'||r.message.length>4096)return;
      run.cases.add(r.caseId);send({type:'case-result',runId:run.runId,codeRevision:run.codeRevision,caseId:r.caseId,name:exercise.testCases.find(t=>t.id===r.caseId).name,passed:r.passed,message:r.message});return;
    }
    if(r.type==='console'){if(run.lines++>=200||typeof r.text!=='string'||r.text.length>4096||!['log','warn','error'].includes(r.level))return;send({type:'console',runId:run.runId,codeRevision:run.codeRevision,level:r.level,text:r.text});return}
    if(r.type==='result'&&!exercise){clearTimeout(run.timer);worker.terminate();active=null;send({type:'done',runId:run.runId,status:r.status==='success'?'success':'error',output:typeof r.output==='string'?r.output.slice(0,4096):''});return}
    if(r.type==='done'){
      if(!exercise||!['passed','failed'].includes(r.status)||r.total!==exercise.testCases.length||!Number.isInteger(r.passed)||r.passed<0||r.passed>r.total||run.cases.size!==r.total)return;
      clearTimeout(run.timer);worker.terminate();active=null;send({type:'done',runId:run.runId,codeRevision:run.codeRevision,status:r.status,passed:r.passed,total:r.total});return;
    }
    if(r.type==='error')stop(run.runId,'error');
  });
  worker.addEventListener('error',()=>stop(run.runId,'error'));
  worker.postMessage({type:'run',runId:run.runId,code:m.code,exerciseId:m.exerciseId,revision:m.revision,codeRevision:m.codeRevision});
});
window.addEventListener('pagehide',()=>{if(active){clearTimeout(active.timer);active.worker.terminate();active=null}});

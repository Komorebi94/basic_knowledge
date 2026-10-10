import { exercises } from '../src/content/practice/index.ts';
import { executeCase } from './harness.js';
const nativeTimeout=self.setTimeout.bind(self);
const nextTask=()=>new Promise(resolve=>nativeTimeout(resolve,0));
let started=false;
self.addEventListener('message',async(event)=>{
  const m=event.data;
  if(started||!m||m.type!=='run'||typeof m.runId!=='string'||typeof m.code!=='string')return;
  started=true;
  const emit=message=>self.postMessage({...message,runId:m.runId,codeRevision:m.codeRevision});
  // Compatibility probe for the pre-existing isolation verification only.
  if(m.exerciseId===undefined){try{const output=await new Function(`"use strict";\n${m.code}`)();emit({type:'result',status:'success',output:String(output).slice(0,4096)})}catch(error){emit({type:'result',status:'error',output:error instanceof Error?error.message.slice(0,4096):'运行失败'})}return}
  const exercise=exercises.find(e=>e.id===m.exerciseId&&e.revision===m.revision);
  if(!exercise){emit({type:'error',reason:'题目版本不可用'});return}
  let lines=0,bytes=0;const log=(level,...values)=>{if(lines>=200||bytes>=65536)return;const text=values.map(v=>{try{return String(v)}catch{return '[无法展示]'}}).join(' ').slice(0,4096);lines++;bytes+=new TextEncoder().encode(text).length;emit({type:'console',level,text})};
  console.log=(...v)=>log('log',...v);console.error=(...v)=>log('error',...v);console.warn=(...v)=>log('warn',...v);
  let rejection=null;const onReject=event=>{event.preventDefault();rejection='存在未处理的 Promise 拒绝'};self.addEventListener('unhandledrejection',onReject);
  let passed=0;
  for(const test of exercise.testCases){
    try{await executeCase(m.code,test);await nextTask();if(rejection)throw new Error(rejection);passed++;emit({type:'case-result',caseId:test.id,name:test.name,passed:true,message:'通过'})}
    catch(error){emit({type:'case-result',caseId:test.id,name:test.name,passed:false,message:error instanceof Error?error.message.slice(0,4096):'运行异常'})}
  }
  emit({type:'done',status:passed===exercise.testCases.length?'passed':'failed',passed,total:exercise.testCases.length});
});

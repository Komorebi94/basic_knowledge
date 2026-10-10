import type { CaseResult, RunStatus } from '../../domain/practice';
import type { Exercise } from '../../content/practice';
export interface RunnerResult { status: Exclude<RunStatus,'running'>; caseResults: CaseResult[]; passed: number; total: number; durationMs: number; message: string }
interface Request { runId: string; exercise: Exercise; code: string; codeRevision: number; onReady?: () => void; onCase?: (result: CaseResult) => void; onConsole?: (line: string) => void }
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
export class RunnerClient {
  private cancel: (()=>void)|null=null;
  stop(){this.cancel?.()}
  run(request: Request): Promise<RunnerResult> {
    this.stop();
    return new Promise(resolve=>{
      let runnerOrigin:string;
      try{const url=new URL(import.meta.env.VITE_RUNNER_ORIGIN??'http://127.0.0.1:5174');if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.origin===location.origin)throw new Error('运行环境必须使用独立地址');runnerOrigin=url.origin}
      catch{resolve({status:'error',caseResults:[],passed:0,total:request.exercise.testCases.length,durationMs:0,message:'运行环境地址不可用，请配置独立 origin'});return}
      const frame=document.createElement('iframe');frame.title='隔离练习运行器';frame.hidden=true;frame.sandbox.add('allow-scripts','allow-same-origin');frame.src=runnerOrigin;
      const token=crypto.randomUUID()+crypto.randomUUID(), results:CaseResult[]=[];const begun=performance.now();let finished=false,ready=false,bytes=0,lines=0, timer:ReturnType<typeof setTimeout>;
      const total=request.exercise.testCases.length;
      const finish=(status:RunnerResult['status'],message='')=>{
        if(finished)return;finished=true;clearTimeout(timer);window.removeEventListener('message',receive);
        frame.contentWindow?.postMessage({protocolVersion:1,token,type:'stop',runId:request.runId},runnerOrigin);
        frame.remove();this.cancel=null;resolve({status,caseResults:results,passed:results.filter(r=>r.passed).length,total,durationMs:Math.max(0,performance.now()-begun),message});
      };
      const receive=(event:MessageEvent<unknown>)=>{
        if(event.source!==frame.contentWindow||event.origin!==runnerOrigin||!record(event.data))return;
        const m=event.data;if(m.token!==token||m.protocolVersion!==1)return;
        let length:number;try{length=new TextEncoder().encode(JSON.stringify(m)).length}catch{return}bytes+=length;if(length>16384||bytes>262144){finish('error','结果超过大小限制');return}
        if(m.type==='ready'&&!ready){ready=true;clearTimeout(timer);request.onReady?.();timer=setTimeout(()=>finish('timeout','运行超过题目时间预算'),Math.min(5000,request.exercise.timeoutMs));frame.contentWindow?.postMessage({protocolVersion:1,token,type:'run',runId:request.runId,exerciseId:request.exercise.id,revision:request.exercise.revision,codeRevision:request.codeRevision,code:request.code,timeoutMs:request.exercise.timeoutMs},runnerOrigin);return}
        if(!ready||m.runId!==request.runId||m.codeRevision!==request.codeRevision)return;
        if(m.type==='case-result'){
          const test=request.exercise.testCases.find(t=>t.id===m.caseId);if(!test||results.some(r=>r.id===test.id)||typeof m.passed!=='boolean'||typeof m.message!=='string'||m.message.length>4096)return;
          const result={id:test.id,name:test.name,passed:m.passed,message:m.message};results.push(result);request.onCase?.(result);return;
        }
        if(m.type==='console'){if(lines++>=200||typeof m.text!=='string'||m.text.length>4096)return;request.onConsole?.(m.text);return}
        if(m.type==='done'){
          if(typeof m.status!=='string'||!['passed','failed','timeout','stopped','error'].includes(m.status))return;
          const passed=results.filter(r=>r.passed).length;
          if(m.status==='passed'||m.status==='failed'){if(results.length!==total||m.total!==total||m.passed!==passed||m.status!==(passed===total?'passed':'failed'))return;finish(passed===total?'passed':'failed')}
          else finish(m.status==='timeout'?'timeout':m.status==='stopped'?'stopped':'error',String(m.status));return;
        }
        if(m.type==='error')finish('error',typeof m.reason==='string'?m.reason.slice(0,4096):'运行环境异常');
      };
      this.cancel=()=>finish('stopped','已停止运行');window.addEventListener('message',receive);
      timer=setTimeout(()=>finish('error','当前环境暂不支持运行，请启动独立运行服务后重试'),3000);
      frame.addEventListener('load',()=>frame.contentWindow?.postMessage({protocolVersion:1,token,type:'init'},runnerOrigin),{once:true});
      frame.addEventListener('error',()=>finish('error','运行环境无法加载'),{once:true});document.body.append(frame);
    });
  }
}

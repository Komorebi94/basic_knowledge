export type Assistance = "independent" | "hint" | "reference" | "external";
export type RunStatus = "running" | "passed" | "failed" | "error" | "timeout" | "stopped";
export interface CaseResult { readonly id: string; readonly name: string; readonly passed: boolean; readonly message: string }
export interface PracticeDraft { exerciseId: string; exerciseRevision: number; attemptId: string; code: string; codeRevision: number; revision: number; updatedAt: string }
export interface PracticeAttempt { id: string; exerciseId: string; exerciseRevision: number; startedAt: string; codeSnapshot: string | null; endedAt: string | null; assistance: Assistance; hintLevel: number; referenceRevealed: boolean; selfReportedHelp: boolean; reflection: string }
export interface PracticeRun { id: string; attemptId: string; exerciseId: string; exerciseRevision: number; codeRevision: number; codeSnapshot: string | null; status: RunStatus; caseResults: CaseResult[]; passed: number; total: number; createdAt: string; durationMs: number }
export interface PracticeEvidence { id: string; exerciseId: string; exerciseRevision: number; attemptId: string; runId: string; completionKind: "independent" | "reference"; completedAt: string }
export interface PracticeState { drafts: Record<string, PracticeDraft>; attempts: PracticeAttempt[]; runs: PracticeRun[]; evidence: PracticeEvidence[] }
export const emptyPracticeState = (): PracticeState => ({drafts:{},attempts:[],runs:[],evidence:[]});
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max=200): v is string => typeof v === "string" && v.length <= max;
const id = (v: unknown): v is string => text(v) && v.length > 0 && v !== "__proto__" && v !== "constructor" && v !== "prototype";
const integer = (v: unknown, min=0): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= min;
const date = (v: unknown): v is string => text(v,40) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString()===v;
const assistance = (v: unknown): v is Assistance => typeof v === "string" && ["independent","hint","reference","external"].includes(v);
const status = (v: unknown): v is RunStatus => typeof v === "string" && ["running","passed","failed","error","timeout","stopped"].includes(v);
export function isPracticeState(value: unknown): value is PracticeState {
  if (!object(value) || !object(value.drafts) || !Array.isArray(value.attempts) || !Array.isArray(value.runs) || !Array.isArray(value.evidence)) return false;
  if ([value.attempts,value.runs,value.evidence].some(a=>a.length>100000)) return false;
  const attempts=new Map<string,Record<string,unknown>>(), runs=new Map<string,Record<string,unknown>>(), evidenceIds=new Set(), evidenceRunIds=new Set();
  for (const a of value.attempts) {
    if (!object(a)||!id(a.id)||attempts.has(a.id)||!id(a.exerciseId)||!integer(a.exerciseRevision,1)||!date(a.startedAt)||(a.codeSnapshot!==null&&!text(a.codeSnapshot,100000))||(a.endedAt!==null&&!date(a.endedAt))||!assistance(a.assistance)||!integer(a.hintLevel)||a.hintLevel>3||typeof a.referenceRevealed!=="boolean"||typeof a.selfReportedHelp!=="boolean"||!text(a.reflection,20000)) return false;
    if ((a.hintLevel>0||a.referenceRevealed||a.selfReportedHelp)&&a.assistance==="independent") return false;
    attempts.set(a.id,a);
  }
  for (const [key,d] of Object.entries(value.drafts)) {
    if (!object(d)||!id(key)||d.exerciseId!==key||!integer(d.exerciseRevision,1)||!id(d.attemptId)||!text(d.code,100000)||!integer(d.codeRevision,1)||!integer(d.revision,1)||!date(d.updatedAt)) return false;
    const a=attempts.get(d.attemptId); if (!a||a.exerciseId!==key||a.exerciseRevision!==d.exerciseRevision) return false;
  }
  for (const r of value.runs) {
    if (!object(r)||!id(r.id)||runs.has(r.id)||!id(r.attemptId)||!id(r.exerciseId)||!integer(r.exerciseRevision,1)||!integer(r.codeRevision,1)||(r.codeSnapshot!==null&&!text(r.codeSnapshot,100000))||!status(r.status)||!integer(r.passed)||!integer(r.total)||r.total>1000||r.passed>r.total||!date(r.createdAt)||typeof r.durationMs!=="number"||!Number.isFinite(r.durationMs)||r.durationMs<0||!Array.isArray(r.caseResults)||r.caseResults.length>1000) return false;
    const a=attempts.get(r.attemptId);if(!a||a.exerciseId!==r.exerciseId||a.exerciseRevision!==r.exerciseRevision)return false;
    const cases=new Set();for(const c of r.caseResults){if(!object(c)||!id(c.id)||cases.has(c.id)||!text(c.name,200)||typeof c.passed!=="boolean"||!text(c.message,4096))return false;cases.add(c.id)}
    if(r.status==="passed"&&(r.total===0||r.passed!==r.total||(r.caseResults.length>0&&(r.caseResults.length!==r.total||r.caseResults.some(c=>!c.passed)))))return false;
    runs.set(r.id,r);
  }
  for (const e of value.evidence) {
    if (!object(e)||!id(e.id)||evidenceIds.has(e.id)||evidenceRunIds.has(e.runId)||!id(e.runId)||!id(e.attemptId)||!id(e.exerciseId)||!integer(e.exerciseRevision,1)||(typeof e.completionKind!=="string"||!["independent","reference"].includes(e.completionKind))||!date(e.completedAt))return false;
    const r=runs.get(e.runId);if(!r||r.status!=="passed"||r.attemptId!==e.attemptId||r.exerciseId!==e.exerciseId||r.exerciseRevision!==e.exerciseRevision)return false;
    if((e.completionKind==="independent")!==(attempts.get(e.attemptId)?.assistance==="independent"))return false;
    evidenceIds.add(e.id);evidenceRunIds.add(e.runId);
  }
  return true;
}
export function normalizePracticeState(value: PracticeState): PracticeState {
  return {
    drafts:Object.fromEntries(Object.entries(value.drafts).map(([key,d])=>[key,{exerciseId:d.exerciseId,exerciseRevision:d.exerciseRevision,attemptId:d.attemptId,code:d.code,codeRevision:d.codeRevision,revision:d.revision,updatedAt:d.updatedAt}])),
    attempts:value.attempts.map(a=>({id:a.id,exerciseId:a.exerciseId,exerciseRevision:a.exerciseRevision,startedAt:a.startedAt,codeSnapshot:a.codeSnapshot,endedAt:a.endedAt,assistance:a.assistance,hintLevel:a.hintLevel,referenceRevealed:a.referenceRevealed,selfReportedHelp:a.selfReportedHelp,reflection:a.reflection})),
    runs:value.runs.map(r=>({id:r.id,attemptId:r.attemptId,exerciseId:r.exerciseId,exerciseRevision:r.exerciseRevision,codeRevision:r.codeRevision,codeSnapshot:r.codeSnapshot,status:r.status,caseResults:r.caseResults.map(c=>({id:c.id,name:c.name,passed:c.passed,message:c.message})),passed:r.passed,total:r.total,createdAt:r.createdAt,durationMs:r.durationMs})),
    evidence:value.evidence.map(e=>({id:e.id,exerciseId:e.exerciseId,exerciseRevision:e.exerciseRevision,attemptId:e.attemptId,runId:e.runId,completionKind:e.completionKind,completedAt:e.completedAt})),
  };
}
export function startAttempt(state: PracticeState, exerciseId: string, exerciseRevision: number, code: string, now: string, attemptId: string): PracticeState {
  const previous=state.drafts[exerciseId];
  return {...state,attempts:[...state.attempts.map(a=>a.id===previous?.attemptId?{...a,endedAt:now,codeSnapshot:previous?.code??null}:a),{id:attemptId,exerciseId,exerciseRevision,startedAt:now,codeSnapshot:null,endedAt:null,assistance:"independent",hintLevel:0,referenceRevealed:false,selfReportedHelp:false,reflection:""}],drafts:{...state.drafts,[exerciseId]:{exerciseId,exerciseRevision,attemptId,code,codeRevision:1,revision:(previous?.revision??0)+1,updatedAt:now}}};
}
export function markAssistance(state: PracticeState, attemptId: string, kind: Assistance, hintLevel=0): PracticeState {
  const rank={independent:0,hint:1,reference:2,external:3};
  // Evidence already recorded remains historically accurate; assistance after completion belongs to a new attempt.
  if(state.evidence.some(e=>e.attemptId===attemptId))throw new Error("本次已有通过证据，请开始新尝试后查看辅助");
  return {...state,attempts:state.attempts.map(a=>a.id===attemptId?{...a,assistance:rank[kind]>rank[a.assistance]?kind:a.assistance,hintLevel:Math.max(a.hintLevel,hintLevel),referenceRevealed:a.referenceRevealed||kind==="reference",selfReportedHelp:a.selfReportedHelp||kind==="external"}:a)};
}
export function finishRun(state: PracticeState, result: PracticeRun, evidenceId: string, now: string): PracticeState {
  if(state.runs.some(r=>r.id===result.id&&r.status!=="running"))return state;
  const attempt=state.attempts.find(a=>a.id===result.attemptId);if(!attempt)throw new Error("尝试已变更");
  const runs=state.runs.some(r=>r.id===result.id)?state.runs.map(r=>r.id===result.id?result:r):[...state.runs,result];
  const evidence=result.status==="passed"&&!state.evidence.some(e=>e.runId===result.id)?[...state.evidence,{id:evidenceId,exerciseId:result.exerciseId,exerciseRevision:result.exerciseRevision,attemptId:result.attemptId,runId:result.id,completionKind:attempt.assistance==="independent"?"independent" as const:"reference" as const,completedAt:now}]:state.evidence;
  const keep=new Set(runs.slice(-20).map(r=>r.id));
  for(const exerciseId of new Set(evidence.map(e=>e.exerciseId))){const independent=evidence.filter(e=>e.exerciseId===exerciseId&&e.completionKind==="independent").at(-1);if(independent)keep.add(independent.runId)}
  return {...state,evidence,runs:runs.map(r=>keep.has(r.id)?r:{...r,codeSnapshot:null,caseResults:[]})};
}
export function getPracticeSummary(state: PracticeState, revisions: Readonly<Record<string, number>> = {}) {
  const current=(exerciseId:string,revision:number)=>revisions[exerciseId]===undefined||revisions[exerciseId]===revision;
  const independentExerciseIds=[...new Set(state.evidence.filter(e=>e.completionKind==='independent'&&current(e.exerciseId,e.exerciseRevision)).map(e=>e.exerciseId))];
  const weakExerciseIds:string[]=[];
  for(const exerciseId of new Set(state.attempts.map(a=>a.exerciseId))){
    const latestRun=state.runs.filter(r=>r.exerciseId===exerciseId&&current(exerciseId,r.exerciseRevision)&&['passed','failed'].includes(r.status)).at(-1);
    if(!latestRun)continue;
    const evidence=state.evidence.find(e=>e.runId===latestRun.id);
    if(latestRun.status==='failed'||evidence?.completionKind==='reference')weakExerciseIds.push(exerciseId);
  }
  const history=[...state.attempts.map(a=>({id:a.id,exerciseId:a.exerciseId,label:`开始尝试${a.assistance==='independent'?'':' · 使用辅助'}`,occurredAt:a.startedAt})),...state.runs.map(r=>({id:r.id,exerciseId:r.exerciseId,label:`运行 · ${r.status} · ${r.passed}/${r.total}`,occurredAt:r.createdAt}))].sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));
  return {independentExerciseIds,weakExerciseIds,history};
}

/** Drop optional run details, keeping durable evidence and the latest independent solution per exercise. */
export function cleanupRunDetails(state: PracticeState): PracticeState {
  const keep=new Set<string>();
  for(const exerciseId of new Set(state.evidence.map(e=>e.exerciseId))){
    const last=state.evidence.filter(e=>e.exerciseId===exerciseId&&e.completionKind==='independent').at(-1);
    if(last)keep.add(last.runId);
  }
  return {...state,runs:state.runs.map(r=>keep.has(r.id)||r.status==='running'?r:{...r,codeSnapshot:null,caseResults:[]}),attempts:state.attempts.map(a=>a.endedAt?{...a,codeSnapshot:null}:a)};
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router';
import { readLearning, updateLearning, readPersonalDataset, registerUnsavedDataGuard, type LearningSnapshot } from '../../infrastructure/persistence/personalStore';
import { startAttempt, markAssistance, type PracticeState, type PracticeDraft } from '../../domain/practice';
import type { LearningState } from '../../domain/learning';
import type { Exercise } from '../../content/practice';

export function usePractice(exercise: Exercise) {
  const [snapshot,setSnapshot]=useState<LearningSnapshot|null>(null),[code,setCode]=useState(exercise.starterArtifact),[error,setError]=useState(''),[status,setStatus]=useState('正在读取'),[remote,setRemote]=useState<LearningSnapshot|null>(null),[reflection,setReflection]=useState(''),[reload,setReload]=useState(0),[codeRevision,setCodeRevision]=useState(0);
  const data=useRef({snapshot:null as LearningSnapshot|null,code:exercise.starterArtifact,saved:exercise.starterArtifact,draft:null as PracticeDraft|null,blocked:false,reflection:'',savedReflection:'',codeRevision:0});
  const dirty=()=>data.current.code!==data.current.saved||data.current.reflection!==data.current.savedReflection||(data.current.draft!==null&&data.current.codeRevision!==data.current.draft.codeRevision);
  const mounted=useRef(false),flight=useRef<Promise<boolean>|null>(null);
  const apply=useCallback((value:LearningSnapshot)=>{data.current.snapshot=value;data.current.draft=value.state.practice.drafts[exercise.id]??null;if(mounted.current)setSnapshot(value)},[exercise.id]);
  const save=useCallback(():Promise<boolean>=>{
    if(flight.current)return flight.current;
    if(data.current.blocked||!data.current.snapshot||!data.current.draft)return Promise.resolve(false);
    if(!dirty())return Promise.resolve(true);
    const operation=async()=>{
      try{
        while(dirty()){
          const current=data.current,code=current.code,codeRevision=current.codeRevision,reflection=current.reflection,draft=current.draft,snapshot=current.snapshot;
          if(!draft||!snapshot)return false;
          if(mounted.current)setStatus('正在保存');
          const value=await updateLearning(state=>{const actual=state.practice.drafts[exercise.id];if(!actual||actual.revision!==draft.revision||actual.attemptId!==draft.attemptId)throw new Error('代码已在另一页面更新，请比较后选择');return {...state,practice:{...state.practice,attempts:state.practice.attempts.map(a=>a.id===actual.attemptId?{...a,reflection}:a),drafts:{...state.practice.drafts,[exercise.id]:{...actual,code,codeRevision,revision:actual.revision+1,updatedAt:new Date().toISOString()}}}}},snapshot.datasetId);
          data.current.saved=code;data.current.savedReflection=reflection;apply(value);
        }
        if(mounted.current){setStatus('已保存');setError('')}return true;
      }catch(cause:unknown){data.current.blocked=true;if(mounted.current){setStatus('保存未完成');setError(cause instanceof Error?cause.message:'保存失败，代码仍在当前页面');try{setRemote(await readLearning())}catch{/* Existing local input remains available for copying. */}}return false}
      finally{flight.current=null}
    };
    flight.current=operation();return flight.current;
  },[apply,exercise.id]);
  useEffect(()=>{
    mounted.current=true;let cancelled=false;
    const load=async()=>{
      try{
        let value=await readLearning();
        if(!value.state.practice.drafts[exercise.id]){
          const legacy=await readPersonalDataset();const old=legacy.datasetId===value.datasetId?legacy.records.find(r=>r.kind==='draft'&&r.payload.exerciseId===exercise.id):undefined;
          const code=old?.kind==='draft'?old.payload.code:exercise.starterArtifact;const revision=old?.kind==='draft'?old.payload.exerciseRevision:exercise.revision;
          const attemptId=crypto.randomUUID();
          value=await updateLearning(state=>{if(state.practice.drafts[exercise.id])return state;let practice=startAttempt(state.practice,exercise.id,revision,code,new Date().toISOString(),attemptId);if(old)practice=markAssistance(practice,attemptId,'external');return {...state,practice}},value.datasetId);
        }
        if(cancelled)return;
        const loadedDraft=value.state.practice.drafts[exercise.id];if(!loadedDraft)throw new Error('草稿未能建立');if(data.current.code!==data.current.saved){apply(value);data.current.saved=loadedDraft.code;data.current.blocked=true;setRemote(value);setStatus('需要比较草稿');return}apply(value);const initial=loadedDraft.code;data.current.codeRevision=loadedDraft.codeRevision;setCodeRevision(loadedDraft.codeRevision);data.current.code=data.current.saved=initial;data.current.blocked=false;const initialReflection=value.state.practice.attempts.find(a=>a.id===loadedDraft.attemptId)?.reflection??'';data.current.reflection=data.current.savedReflection=initialReflection;setReflection(initialReflection);setCode(initial);setStatus('已保存');
      }catch(cause:unknown){if(!cancelled){setError(cause instanceof Error?cause.message:'草稿无法读取');setStatus('读取失败')}}
    };void load();
    return()=>{cancelled=true;mounted.current=false};
  },[apply,exercise,reload]);
  useEffect(()=>{
    const update=()=>{void readLearning().then(value=>{if(!mounted.current)return;const d=value.state.practice.drafts[exercise.id];if(flight.current)return;if(dirty()){if(d?.revision!==data.current.draft?.revision)setRemote(value);return}apply(value);if(d){data.current.codeRevision=d.codeRevision;setCodeRevision(d.codeRevision);data.current.code=data.current.saved=d.code;setCode(d.code);const text=value.state.practice.attempts.find(a=>a.id===d.attemptId)?.reflection??'';data.current.reflection=data.current.savedReflection=text;setReflection(text)}}).catch(()=>{if(mounted.current)setError('外部更新暂时无法读取，请保留代码后重试')})};
    window.addEventListener('zhixu-data-change',update);window.addEventListener('focus',update);return()=>{window.removeEventListener('zhixu-data-change',update);window.removeEventListener('focus',update)};
  },[apply,exercise.id]);
  useEffect(()=>registerUnsavedDataGuard(()=>dirty()||flight.current!==null),[]);
  useEffect(()=>{if(!dirty())return;const timer=setTimeout(()=>{void save()},500);return()=>clearTimeout(timer)},[code,reflection,save]);
  useEffect(()=>{const guard=(event:BeforeUnloadEvent)=>{if(dirty()||flight.current)event.preventDefault()};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[]);
  const blocker=useBlocker(({currentLocation,nextLocation})=>currentLocation.pathname!==nextLocation.pathname&&(dirty()||flight.current!==null));
  useEffect(()=>{if(blocker.state==='blocked')void save().then(ok=>{if(ok)blocker.proceed()})},[blocker,save]);
  const mutate=useCallback(async(updater:(state:LearningState)=>LearningState)=>{const current=data.current.snapshot;if(!current)throw new Error('数据尚未读取');const value=await updateLearning(updater,current.datasetId);apply(value);return value},[apply]);
  const change=(value:string)=>{if(value!==data.current.code)data.current.codeRevision++;data.current.code=value;setCodeRevision(data.current.codeRevision);setCode(value);if(!data.current.blocked)setStatus(dirty()?'等待保存':'已保存')};
  const resolveConflict=async(useRemote:boolean)=>{const latest=await readLearning();const d=latest.state.practice.drafts[exercise.id];apply(latest);data.current.saved=d?.code??'';data.current.savedReflection=latest.state.practice.attempts.find(a=>a.id===d?.attemptId)?.reflection??'';data.current.blocked=false;setRemote(null);if(useRemote){data.current.codeRevision=d?.codeRevision??0;setCodeRevision(data.current.codeRevision);data.current.code=data.current.saved;setCode(data.current.code);data.current.reflection=data.current.savedReflection;setReflection(data.current.reflection);setStatus('已保存');setError('')}else if(!d){setError('数据集已变更，请加载新版本或复制当前代码');data.current.blocked=true}else{data.current.codeRevision=Math.max(data.current.codeRevision,(d.codeRevision??0)+1);setCodeRevision(data.current.codeRevision);await save()}};
  const updatePractice=(updater:(state:PracticeState)=>PracticeState)=>mutate(state=>({...state,practice:updater(state.practice)}));
  const acceptSaved=(value:string,text='')=>{data.current.codeRevision=data.current.draft?.codeRevision??1;setCodeRevision(data.current.codeRevision);data.current.code=data.current.saved=value;data.current.reflection=data.current.savedReflection=text;setCode(value);setReflection(text);setStatus('已保存')};
  const retry=()=>{if(!data.current.snapshot){setReload(v=>v+1);return}data.current.blocked=false;void save()};
  const changeReflection=(value:string)=>{data.current.reflection=value;setReflection(value);if(!data.current.blocked)setStatus('等待保存')};
  return {snapshot,code,status,error,setError,remote,save,change,mutate,updatePractice,resolveConflict,blocker,data,acceptSaved,retry,reflection,changeReflection,codeRevision};
}

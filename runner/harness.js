// Trusted test harness. User code is evaluated only inside the isolated Worker.
export async function executeCase(code, test) {
  let now=0, sequence=0; const timers=new Map();
  const equal=(actual,expected)=>{
    const seen=new WeakMap();
    function compare(a,b){
      if(Object.is(a,b))return true;
      if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;
      if(Object.getPrototypeOf(a)!==Object.getPrototypeOf(b))return false;
      if(seen.get(a)===b)return true;seen.set(a,b);
      if(a instanceof Date)return Object.is(a.getTime(),b.getTime());
      if(a instanceof Map)return a.size===b.size&&[...a].every(([k,v])=>b.has(k)&&compare(v,b.get(k)));
      if(a instanceof Set)return a.size===b.size&&[...a].every(v=>b.has(v));
      const keys=Reflect.ownKeys(a);return keys.length===Reflect.ownKeys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&compare(a[k],b[k]));
    }
    if(!compare(actual,expected))throw new Error('实际结果与预期不一致');
  };
  const assert=(condition,message='条件不满足')=>{if(!condition)throw new Error(message)};
  const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
  const flush=async()=>{for(let i=0;i<32;i++)await Promise.resolve()};
  const expectThrow=(fn,name)=>{let caught=false;try{fn()}catch(e){caught=true;equal(e.name,name)}assert(caught,'未出现预期异常 '+name)};
  const expectReject=async(p,name,identity)=>{let caught=false;try{await p}catch(e){caught=true;equal(e.name,name);if(identity!==undefined)assert(e===identity,'异常身份不符')}assert(caught,'Promise未按预期拒绝 '+name)};
  const setTimeout=(callback,ms)=>{const id=++sequence;timers.set(id,{callback,time:now+ms});return id};
  const clearTimeout=id=>timers.delete(id);
  const clock={get now(){return now},get size(){return timers.size},async tick(ms){
    const target=now+ms;let count=0;await flush();
    for(;;){const due=[...timers].filter(([,t])=>t.time<=target).sort((a,b)=>a[1].time-b[1].time||a[0]-b[0])[0];if(!due)break;if(++count>1000)throw new Error('虚拟计时器循环超限');const [id,t]=due;timers.delete(id);now=t.time;t.callback();await flush()}
    now=target;await flush();
  }};
  Date.now=()=>now;
  // Helpers are lexical parameters; tests get a new clock and user entry per case.
  const execute=new Function('assert','equal','deferred','flush','expectThrow','expectReject','clock','setTimeout','clearTimeout',`"use strict";\n${code}\nreturn (async()=>{${test.code}\n})();`);
  try { await execute(assert,equal,deferred,flush,expectThrow,expectReject,clock,setTimeout,clearTimeout); }
  finally { timers.clear(); }
}

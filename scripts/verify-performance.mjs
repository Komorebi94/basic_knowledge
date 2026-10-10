import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import os from 'node:os';
const metadata=JSON.parse(await readFile(new URL('../src/content/publicMetadata.json',import.meta.url),'utf8'));
const origin=process.env.ZHIXU_PREVIEW_ORIGIN??'http://127.0.0.1:5192';
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={verifiedAt:new Date().toISOString(),browser:browser.version(),device:{platform:os.platform(),arch:os.arch(),cpu:os.cpus()[0]?.model},conditions:{width:390,height:844,downloadMbps:10,latencyMs:100,cpuThrottle:4,coldCache:true},home:[],search:null};
try {
 for(let iteration=0;iteration<5;iteration++) {
  const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:1_250_000,uploadThroughput:1_250_000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.addInitScript(()=>{window.measurements={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.measurements.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.measurements.cls+=e.value}).observe({type:'layout-shift',buffered:true})});
  await page.goto(origin,{waitUntil:'networkidle'});await page.getByText(`0 / ${metadata.articles.length}`,{exact:true}).waitFor();await page.waitForTimeout(400);
  const result=await page.evaluate(()=>({...window.measurements,scripts:performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.js')).map(e=>new URL(e.name).pathname)}));
  let jsGzip=0;for(const path of new Set(result.scripts)){const file=new URL('../dist'+path,import.meta.url);await stat(file);jsGzip+=gzipSync(await readFile(file)).length}
  report.home.push({iteration:iteration+1,lcpMs:result.lcp,cls:result.cls,initialJsGzipBytes:jsGzip,scripts:result.scripts});await context.close();
 }
 const context=await browser.newContext();const page=await context.newPage();await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
 report.search=await page.evaluate(async()=>{const {searchDocuments}=await import('/src/infrastructure/search/search.ts');const {publicSearchDocuments}=await import('/src/content/searchDocuments.ts');const base=publicSearchDocuments.filter(d=>d.availability==='readable');const documents=Array.from({length:1000},(_,i)=>({...base[i%base.length],id:`bench-${i}`,order:i}));const queries=Array.from({length:100},(_,i)=>['闭包','closure','Promise','事件循环','类型','state','缓存','AbortSignal','测试','请求'][i%10]);const durations=[];for(const q of queries){const start=performance.now();searchDocuments(documents,q);durations.push(performance.now()-start)}durations.sort((a,b)=>a-b);return {documents:documents.length,queries:queries.length,p50Ms:durations[49],p95Ms:durations[94],maximumMs:durations[99]}});
 assert(report.home.every(r=>r.lcpMs>0&&r.lcpMs<=2500),'首页LCP预算');assert(report.home.every(r=>r.cls<=0.1),'CLS预算');assert(report.home.every(r=>r.initialJsGzipBytes<=250*1024),'初始JS预算');assert(report.search.p95Ms<=100,'1000内容搜索p95预算');
 report.limitations=['实验室结果，不代表所有用户Core Web Vitals','未测真实用户INP或全部移动设备','搜索计时排除索引加载；当前搜索由提交触发，没有150ms实时防抖流程'];
 await writeFile(new URL('../docs/verification/p0-performance.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close()}

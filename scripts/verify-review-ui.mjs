import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const origin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
async function waitForBrowser(target, predicate, argument) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (await target.evaluate(predicate, argument) === true) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("浏览器持久化条件在10秒内未成立");
}
async function captureReview(page,kind) {
  await mkdir("docs/verification",{recursive:true});
  for(const [size,width] of [["desktop",1440],["mobile",390]]) { await page.setViewportSize({width,height:844}); await page.screenshot({path:`docs/verification/review-${kind}-${size}.png`,fullPage:true}); }
}
const browser = await chromium.launch({channel:"chrome",headless:true});
try {
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(`${origin}/review`,{waitUntil:"networkidle"});
  await page.getByText("还没有订阅卡片，在文章点击加入复习即可开始。",{exact:true}).waitFor();
  await page.evaluate(async () => {
    const store=await import("/src/infrastructure/persistence/personalStore.ts");
    const r=await import("/src/domain/review.ts");
    const content=await import("/src/content/learningContent.ts");
    const data=await store.readLearning();
    await store.updateLearning((state) => ({...state,review:r.subscribeContent(state.review,content.recallCards.slice(0,5),new Date().toISOString())}),data.datasetId);
  });
  await page.getByRole("button",{name:"开始今日回顾（5 张）",exact:true}).click();
  await page.getByRole("heading",{name:"回忆会话",exact:true}).waitFor();
  const route=page.url();
  assert.equal(await page.getByRole("button",{name:"3 · 记住了",exact:true}).isDisabled(),true);
  await page.keyboard.press("3");
  const before=await page.evaluate(async () => (await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning()).state.review.events.length);
  assert.equal(before,0,"未展开答案不能通过快捷键评分");
  await page.getByRole("textbox",{name:"我的回答（可留空）"}).fill("我先从生命周期与作用域解释");
  await waitForBrowser(page, async () => {
    const data=await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning();
    return Object.values(data.state.review.sessions).some((session) => session.answerDraft==="我先从生命周期与作用域解释");
  });
  await page.getByRole("button",{name:"展开参考要点",exact:true}).click();
  await page.getByRole("button",{name:"隐藏参考要点",exact:true}).waitFor({timeout:5000}).catch(async (error) => { console.log(await page.locator("main").innerText()); console.log(await page.evaluate(async () => Object.values((await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning()).state.review.sessions).map(s => ({revision:s.revision,answerRevealed:s.answerRevealed,answerDraft:s.answerDraft})))); throw error; });
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.getByRole("textbox",{name:"我的回答（可留空）"}).inputValue(),"我先从生命周期与作用域解释");
  await page.getByRole("heading",{name:"参考要点",exact:true}).waitFor();
  await captureReview(page,"active");
  // A dirty answer is preserved when another page edits the same session.
  const editingOther=await context.newPage();
  await editingOther.goto(route,{waitUntil:"networkidle"});
  await page.getByRole("textbox",{name:"我的回答（可留空）"}).fill("本页未保存的回忆");
  await editingOther.evaluate(async () => {
    const store=await import("/src/infrastructure/persistence/personalStore.ts");
    const review=await import("/src/domain/review.ts");
    const data=await store.readLearning();
    await store.updateLearning((state) => {
      const session=state.review.sessions[state.review.activeSessionId];
      return {...state,review:review.saveReviewAnswer(state.review,session.sessionId,session.revision,"另一页面的回答",true)};
    },data.datasetId);
  });
  await page.getByRole("alert").filter({hasText:"本页回答保留"}).waitFor();
  assert.equal(await page.getByRole("textbox",{name:"我的回答（可留空）"}).inputValue(),"本页未保存的回忆");
  await page.getByRole("button",{name:"使用已保存会话",exact:true}).click();
  assert.equal(await page.getByRole("textbox",{name:"我的回答（可留空）"}).inputValue(),"另一页面的回答");
  await editingOther.close();
  await page.getByRole("textbox",{name:"我的回答（可留空）"}).fill("我先从生命周期与作用域解释");
  await waitForBrowser(page, async () => Object.values((await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning()).state.review.sessions).some((session) => session.answerDraft==="我先从生命周期与作用域解释"));
  // A real IndexedDB write failure must keep both the displayed cursor and stored aggregate unchanged.
  await page.evaluate(() => {
    const original=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(value,...args) {
      if (value?.kind==="learning") { IDBObjectStore.prototype.put=original; throw new DOMException("测试写入失败","QuotaExceededError"); }
      return original.call(this,value,...args);
    };
  });
  await page.getByRole("button",{name:"3 · 记住了",exact:true}).click();
  await page.getByRole("alert").filter({hasText:"未确认保存前不会自动进入下一卡"}).waitFor();
  const failed=await page.evaluate(async () => (await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning()).state.review);
  assert.equal(failed.events.length,0);
  assert.equal(Object.values(failed.sessions)[0].cursor,0);
  assert.equal(await page.getByRole("textbox",{name:"我的回答（可留空）"}).inputValue(),"我先从生命周期与作用域解释");
  // Two pages race the same card; the transaction permits exactly one event/cursor advance.
  const other=await context.newPage();
  await other.goto(route,{waitUntil:"networkidle"});
  const clickRating = (target) => target.evaluate(() => { const button = [...document.querySelectorAll("button")].find((element) => element.textContent === "3 · 记住了"); button?.click(); button?.click(); });
  await Promise.all([clickRating(page),clickRating(other)]);
  await waitForBrowser(page, async () => {
    const data=await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning();
    return data.state.review.events.filter((event) => !event.revertedAt).length===1;
  });
  const raced=await page.evaluate(async () => (await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning()).state.review);
  assert.equal(raced.events.filter((event) => !event.revertedAt).length,1);
  assert.equal(Object.values(raced.sessions)[0].cursor,1);
  await other.close();
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.getByRole("button",{name:"3 · 记住了",exact:true}).isDisabled(),true,"下一卡的答案重新隐藏");
  await page.getByRole("button",{name:"撤销最近评分",exact:true}).click();
  await waitForBrowser(page, async () => {
    const data=await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning();
    return data.state.review.events.filter((event) => !event.revertedAt).length===0;
  });
  await page.reload({waitUntil:"networkidle"});
  for(let index=0;index<5;index++) {
    await page.getByRole("button",{name:"展开参考要点",exact:true}).click();
    await page.getByRole("button",{name:"隐藏参考要点",exact:true}).waitFor();
    await page.getByRole("button",{name:"4 · 很熟悉",exact:true}).click();
    await waitForBrowser(page, async (count) => {
      const data=await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning();
      return Object.values(data.state.review.sessions)[0].cursor===count;
    },index+1);
  }
  await page.getByRole("heading",{name:"本次回顾已完成",exact:true}).waitFor();
  await page.getByRole("button",{name:"撤销最近评分",exact:true}).click();
  await page.getByRole("textbox",{name:"我的回答（可留空）"}).waitFor();
  const undone=await page.evaluate(async () => (await (await import("/src/infrastructure/persistence/personalStore.ts")).readLearning()).state.review);
  assert.equal(Object.values(undone.sessions)[0].status,"active");
  assert.equal(Object.values(undone.sessions)[0].cursor,4);
  assert.equal(undone.events.filter((event) => !event.revertedAt).length,4);
  await page.getByRole("button",{name:"结束本次队列",exact:true}).click();
  await page.getByText("这次会话已结束，已完成 4 张。尚未评分的卡片仍按原计划保留。",{exact:true}).waitFor();
  await page.goto(`${origin}/review`,{waitUntil:"networkidle"});
  await page.getByRole("button",{name:"暂停复习",exact:true}).first().click();
  await page.getByRole("button",{name:"恢复复习",exact:true}).first().waitFor();
  await page.getByRole("button",{name:"恢复复习",exact:true}).first().click();
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button",{name:"额外回顾（最多 10 张）",exact:true}).click();
  await page.getByRole("textbox",{name:"我的回答（可留空）"}).waitFor();
  await page.setViewportSize({width:320,height:800});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),true,"320px活动会话无整页横向滚动");
  await page.getByRole("button",{name:"展开参考要点",exact:true}).click();
  await page.getByRole("button",{name:"隐藏参考要点",exact:true}).waitFor();
  await page.getByRole("button",{name:"3 · 记住了",exact:true}).click();
  await page.getByRole("heading",{name:"本次回顾已完成",exact:true}).waitFor();
  await page.setViewportSize({width:320,height:800});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),true,"320px会话无整页横向滚动");
  await captureReview(page,"completed");
  await page.goto(`${origin}/review/session/does-not-exist`,{waitUntil:"networkidle"});
  await page.getByRole("heading",{name:"找不到这次复习",exact:true}).waitFor();
  console.log("Review UI verified: real subscription/session, reveal keyboard guard, draft+reveal refresh, failed IDB transaction no advance, cross-tab draft preservation and single score, hidden next answer, undo+last undo, end, pause/resume, extra review, 320px reflow, invalid session");
  await writeFile("docs/verification/review-ui-report.json",JSON.stringify({verifiedAt:new Date().toISOString(),browser:browser.version(),origin,checks:["subscription/session","reveal keyboard guard","draft/reveal refresh","failed IDB transaction no advance","cross-tab draft preservation and single score","hidden next answer","undo and final undo","end","pause/resume","extra review","320px reflow","invalid session"],screenshots:["review-active-desktop.png","review-active-mobile.png","review-completed-desktop.png","review-completed-mobile.png"]},null,2)+"\n");
  await context.close();
} finally { await browser.close(); }

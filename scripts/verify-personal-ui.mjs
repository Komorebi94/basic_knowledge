import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const route = `${origin}/me?tab=notes&content=K01-02`;
  const note = page.getByRole("textbox", { name: "这篇文章的笔记" });
  await page.goto(route, { waitUntil: "networkidle" });
  await note.fill("用自己的话解释闭包");
  await page.locator(".note-editor [role=status]").filter({ hasText: "已保存到本地" }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await note.inputValue(), "用自己的话解释闭包");

  const other = await context.newPage();
  await other.goto(route, { waitUntil: "networkidle" });
  await other.getByRole("textbox", { name: "这篇文章的笔记" }).fill("另一页面更新");
  await other.locator(".note-editor [role=status]").filter({ hasText: "已保存到本地" }).waitFor();
  await note.fill("本页保留的输入");
  await page.getByRole("button", { name: "使用已保存版本" }).waitFor();
  assert.equal(await note.inputValue(), "本页保留的输入");
  await page.getByLabel("选择笔记对应的文章").selectOption("K02-01");
  await page.getByRole("button", { name: "继续编辑" }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("content"), "K01-02");
  await page.getByRole("button", { name: "继续编辑" }).click();
  await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("link", { name: "知识地图" }).click();
  await page.getByRole("button", { name: "继续编辑" }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/me");
  await page.getByRole("button", { name: "继续编辑" }).click();
  await page.getByRole("button", { name: "使用已保存版本" }).click();
  assert.equal(await note.inputValue(), "另一页面更新");
  await other.close();

  await page.goto(`${origin}/me`, { waitUntil: "networkidle" });
  await page.getByText("另一页面更新", { exact: true }).waitFor();
  const exported = await page.evaluate(async () => {
    const store = await import("/src/infrastructure/persistence/personalStore.ts");
    return store.exportPersonalBackup();
  });
  const backup = JSON.parse(exported);
  backup.records.find((record) => record.kind === "note").payload.text = "导入后的笔记";

  await page.goto(`${origin}/settings`, { waitUntil: "networkidle" });
  await page.locator("input[type=file]").setInputFiles({ name: "sample.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: "替换个人数据" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "替换个人数据" }).isDisabled(), true);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载当前数据" }).click();
  assert.match((await download).suggestedFilename(), /^zhixu-backup-.*\.json$/);
  await page.getByRole("checkbox", { name: "我已下载并保留当前数据备份" }).check();
  await page.getByRole("button", { name: "替换个人数据" }).click();
  await page.getByRole("button", { name: "恢复另一数据集" }).waitFor();
  await page.goto(`${origin}/me`, { waitUntil: "networkidle" });
  await page.getByText("导入后的笔记", { exact: true }).waitFor();
  await page.goto(`${origin}/settings`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "恢复另一数据集" }).click();
  await page.getByText("已切换到恢复数据集。", { exact: true }).waitFor();
  await page.goto(`${origin}/me`, { waitUntil: "networkidle" });
  await page.getByText("另一页面更新", { exact: true }).waitFor();
  console.log("Personal UI verified: autosave, refresh, cross-tab conflict, navigation protection, notes, backup download/import/recovery");
} finally {
  await browser.close();
}

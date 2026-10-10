import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
await mkdir("docs/verification", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/knowledge/javascript/closures`, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `docs/verification/reading-${width}.png`, fullPage: false });
  }
  console.log("Reading screenshots captured at 1440, 1024 and 390px in", browser.version());
} finally {
  await browser.close();
}

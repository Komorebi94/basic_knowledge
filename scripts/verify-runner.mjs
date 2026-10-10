import assert from "node:assert/strict";
import { chromium } from "playwright";

const mainOrigin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
const runnerOrigin = process.env.ZHIXU_RUNNER_ORIGIN ?? "http://127.0.0.1:5174";
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;

const browser = await chromium.launch(
  executablePath ? { executablePath, headless: true } : { channel: "chrome", headless: true },
);

try {
  const page = await browser.newPage();
  await page.goto(mainOrigin, { waitUntil: "domcontentloaded" });

  const result = await page.evaluate(async ({ runnerOrigin }) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("zhixu-main-origin-probe", 1);
      request.addEventListener("success", () => {
        request.result.close();
        resolve(undefined);
      }, { once: true });
      request.addEventListener("error", () => reject(request.error), { once: true });
    });

    const frame = document.createElement("iframe");
    frame.src = runnerOrigin;
    frame.sandbox.add("allow-scripts", "allow-same-origin");
    frame.style.display = "none";
    const loaded = new Promise((resolve, reject) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.addEventListener("error", reject, { once: true });
    });
    document.body.append(frame);
    await loaded;

    let frameOriginDenied = false;
    try {
      void frame.contentWindow?.document;
    } catch {
      frameOriginDenied = true;
    }

    const token = crypto.randomUUID() + crypto.randomUUID();
    const source = frame.contentWindow;
    if (!source) throw new Error("运行器页面未加载");

    function waitFor(type, runId) {
      return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          window.removeEventListener("message", onMessage);
          reject(new Error(`等待运行器 ${type} 超时`));
        }, 8_000);

        function onMessage(event) {
          const message = event.data;
          if (
            event.source !== source ||
            event.origin !== runnerOrigin ||
            !message ||
            message.protocolVersion !== 1 ||
            message.token !== token ||
            message.type !== type ||
            (runId !== undefined && message.runId !== runId)
          ) {
            return;
          }
          window.clearTimeout(timeout);
          window.removeEventListener("message", onMessage);
          resolve(message);
        }
        window.addEventListener("message", onMessage);
      });
    }

    function send(message) {
      source.postMessage({ ...message, protocolVersion: 1, token }, runnerOrigin);
    }

    const ready = waitFor("ready");
    send({ type: "init" });
    await ready;

    // On a deployed origin, the first run also downloads the Worker bundle.
    // Use the existing protocol limit for probes; explicit timeout/stop cases remain short.
    async function run(code, timeoutMs = 5_000) {
      const runId = crypto.randomUUID();
      const done = waitFor("done", runId);
      send({ type: "run", runId, code, timeoutMs });
      return done;
    }

    const normal = await run("return 1 + 1");
    const noDocument = await run("return typeof document");
    const noMainDatabase = await run(
      "return indexedDB.databases().then((items) => items.some((item) => item.name === 'zhixu-main-origin-probe'))",
    );
    const noNetwork = await run(
      "return fetch('https://example.com').then(() => 'open', () => 'blocked')",
    );
    const timedOut = await run("while (true) {}", 100);

    const stoppedId = crypto.randomUUID();
    const stopped = waitFor("done", stoppedId);
    send({ type: "run", runId: stoppedId, code: "while (true) {}", timeoutMs: 5_000 });
    window.setTimeout(() => send({ type: "stop", runId: stoppedId }), 50);
    const stoppedResult = await stopped;

    frame.remove();
    return {
      frameOriginDenied,
      normal,
      noDocument,
      noMainDatabase,
      noNetwork,
      timedOut,
      stoppedResult,
    };
  }, { runnerOrigin });

  assert.equal(result.frameOriginDenied, true, "主站不应读到运行器 DOM");
  assert.deepEqual([result.normal.status, result.normal.output], ["success", "2"]);
  assert.deepEqual([result.noDocument.status, result.noDocument.output], ["success", "undefined"]);
  assert.deepEqual([result.noMainDatabase.status, result.noMainDatabase.output], ["success", "false"]);
  assert.deepEqual([result.noNetwork.status, result.noNetwork.output], ["success", "blocked"]);
  assert.equal(result.timedOut.status, "timeout");
  assert.equal(result.stoppedResult.status, "stopped");

  console.log("Runner isolation verified in Chrome:", {
    crossOrigin: result.frameOriginDenied,
    worker: result.normal.output,
    dom: result.noDocument.output,
    mainDatabaseVisible: result.noMainDatabase.output,
    network: result.noNetwork.output,
    timeout: result.timedOut.status,
    stop: result.stoppedResult.status,
  });
} finally {
  await browser.close();
}

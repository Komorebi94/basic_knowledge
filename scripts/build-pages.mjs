import { spawnSync } from "node:child_process";
import { readPagesOrigins } from "./pages-config.mjs";

const target = process.argv[2];
if (!["main", "runner"].includes(target)) throw new Error("构建目标必须是 main 或 runner");
const env = { ...process.env, ...readPagesOrigins(process.env) };
const commands = target === "main" ? ["typecheck", "lint", "build"] : ["typecheck", "lint", "build:runner"];
for (const command of commands) {
  const result = spawnSync("npm", ["run", command], { env, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

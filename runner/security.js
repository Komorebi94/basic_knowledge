export function framePolicy(parentOrigin) {
  return [
    "default-src 'none'",
    "script-src 'self'",
    "worker-src 'self'",
    "connect-src 'none'",
    "style-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    `frame-ancestors ${parentOrigin}`,
  ].join("; ");
}

export const workerPolicy = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-eval'",
  "worker-src 'none'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join("; ");

export function runnerPagesHeaders(parentOrigin, workerPaths) {
  if (workerPaths.length === 0) throw new Error("运行器构建缺少 Worker 文件，不能生成安全响应头");
  // Pages merges overlapping headers. Keep document and Worker CSP rules disjoint.
  return [
    "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Cache-Control: no-cache\n  X-Robots-Tag: noindex",
    ...["/", "/index.html"].map((path) => `${path}\n  Content-Security-Policy: ${framePolicy(parentOrigin)}`),
    ...workerPaths.map((path) => `${path}\n  Content-Security-Policy: ${workerPolicy}`),
    "",
  ].join("\n\n");
}

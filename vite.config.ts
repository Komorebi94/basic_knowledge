import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const console: { info(message: string): void };

interface ListeningServer {
  unref(): void;
  once(event: "error", listener: () => void): void;
  listen(port: number, host: string, listeningListener: () => void): void;
  close(callback: () => void): void;
}

const preferredPort = 5173;
const runnerPort = 5174;

function portAvailable(createServer: () => ListeningServer, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function devPort(): Promise<number> {
  const nodeNet = "node:net";
  const { createServer } = (await import(nodeNet)) as { createServer: () => ListeningServer };
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    if (port === runnerPort) continue;
    if (await portAvailable(createServer, port)) {
      if (port !== preferredPort) {
        console.info(`5173 已被占用，开发服务器改用 ${port}。5174 留给独立运行器。`);
      }
      return port;
    }
  }
  return preferredPort;
}

export default defineConfig(async ({ command, isPreview }) => ({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: command === "serve" && !isPreview ? await devPort() : preferredPort,
    strictPort: true,
  },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
}));

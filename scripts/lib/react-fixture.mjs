import { createRequire } from 'node:module';
import { rolldown } from 'rolldown';

// Bundle the installed React packages for reviewed author examples only.
export async function createReactRuntime() {
  const require = createRequire(import.meta.url);
  const entry = '\0author-react';
  const build = await rolldown({
    input: entry,
    platform: 'browser',
    transform: { define: { 'process.env.NODE_ENV': JSON.stringify('development') } },
    plugins: [{
      name: 'author-react-runtime',
      resolveId(id) {
        if (id === entry) return entry;
        if (['react', 'react-dom', 'react-dom/client'].includes(id)) return require.resolve(id);
      },
      load(id) {
        if (id !== entry) return;
        return `export { createElement, Fragment, Component, StrictMode, Suspense, Profiler, memo, use, useState, useEffect, useTransition, act } from 'react';
export { createRoot, hydrateRoot } from 'react-dom/client';
export { flushSync } from 'react-dom';`;
      },
    }],
  });
  try {
    const output = await build.generate({ format: 'esm' });
    const chunk = output.output.find(item => item.type === 'chunk' && item.isEntry);
    if (!chunk) throw new Error('Missing React author runtime');
    return chunk.code;
  } finally {
    await build.close();
  }
}

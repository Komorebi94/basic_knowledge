import { rolldown } from 'rolldown';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

// Fixed repository author modules only, never reader submissions or imported backups.
export async function bundle(modules, options = {}) {
  const build = await rolldown({
    input: options.input ?? 'entry',
    treeshake: options.treeshake ?? true,
    plugins: [{
      name: 'author-virtual-modules',
      resolveId(id) { return Object.hasOwn(modules, id) ? id : undefined; },
      load(id) { return Object.hasOwn(modules, id) ? modules[id] : undefined; }
    }]
  });
  try {
    return (await build.generate({ format: 'esm', ...options.output })).output;
  } finally { await build.close(); }
}

export async function withFiles(files, action) {
  const root = await mkdtemp(join(tmpdir(), 'zhixu-tooling-author-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const target = resolve(root, name);
      if (!target.startsWith(root + '/') || name.includes('..')) throw new TypeError('Invalid author fixture path');
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
    }
    return await action(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}

export async function runChunks(output, action) {
  const files = { 'package.json': JSON.stringify({ type: 'module' }) };
  for (const item of output) {
    if (item.type === 'chunk') files[item.fileName] = item.code;
  }
  const entry = output.find(item => item.type === 'chunk' && item.isEntry);
  if (!entry) throw new Error('Missing author entry chunk');
  return withFiles(files, async root => {
    const namespace = await import(pathToFileURL(join(root, entry.fileName)).href);
    return action(namespace);
  });
}

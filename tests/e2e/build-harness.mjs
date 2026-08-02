import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, '../..');

await build({
  absWorkingDir: repoRoot,
  entryPoints: [path.join(rootDir, 'harness.ts')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome120'],
  outfile: path.join(rootDir, 'dist/harness.js'),
  alias: {
    '@browser-ai/browser': path.resolve(repoRoot, 'packages/browser/src'),
    '@browser-ai/page-model': path.resolve(repoRoot, 'packages/page-model/src'),
    '@browser-ai/shared': path.resolve(repoRoot, 'packages/shared/src'),
    '@browser-ai/contracts': path.resolve(repoRoot, 'packages/contracts/src'),
    '@browser-ai/commands': path.resolve(repoRoot, 'packages/commands/src'),
    '@browser-ai/engine': path.resolve(repoRoot, 'packages/engine/src'),
    '@browser-ai/memory': path.resolve(repoRoot, 'packages/memory/src'),
    '@browser-ai/ai': path.resolve(repoRoot, 'packages/ai/src'),
    '@browser-ai/agents': path.resolve(repoRoot, 'packages/agents/src'),
    '@browser-ai/telemetry': path.resolve(repoRoot, 'packages/telemetry/src'),
    '@browser-ai/voice': path.resolve(repoRoot, 'packages/voice/src'),
  },
});

console.log('E2E harness built → tests/e2e/dist/harness.js');

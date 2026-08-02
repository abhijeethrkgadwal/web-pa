import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@browser-ai/browser': path.resolve(rootDir, 'packages/browser/src'),
      '@browser-ai/page-model': path.resolve(rootDir, 'packages/page-model/src'),
      '@browser-ai/shared': path.resolve(rootDir, 'packages/shared/src'),
      '@browser-ai/contracts': path.resolve(rootDir, 'packages/contracts/src'),
      '@browser-ai/commands': path.resolve(rootDir, 'packages/commands/src'),
      '@browser-ai/engine': path.resolve(rootDir, 'packages/engine/src'),
      '@browser-ai/memory': path.resolve(rootDir, 'packages/memory/src'),
      '@browser-ai/ai': path.resolve(rootDir, 'packages/ai/src'),
      '@browser-ai/agents': path.resolve(rootDir, 'packages/agents/src'),
      '@browser-ai/voice': path.resolve(rootDir, 'packages/voice/src'),
      '@browser-ai/telemetry': path.resolve(rootDir, 'packages/telemetry/src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
  },
});

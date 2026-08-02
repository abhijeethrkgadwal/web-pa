import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import manifest from './manifest.config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(rootDir, '../../packages');

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@browser-ai/browser': path.resolve(packagesDir, 'browser/src'),
      '@browser-ai/page-model': path.resolve(packagesDir, 'page-model/src'),
      '@browser-ai/shared': path.resolve(packagesDir, 'shared/src'),
      '@browser-ai/contracts': path.resolve(packagesDir, 'contracts/src'),
      '@browser-ai/commands': path.resolve(packagesDir, 'commands/src'),
      '@browser-ai/engine': path.resolve(packagesDir, 'engine/src'),
      '@browser-ai/memory': path.resolve(packagesDir, 'memory/src'),
      '@browser-ai/ai': path.resolve(packagesDir, 'ai/src'),
      '@browser-ai/agents': path.resolve(packagesDir, 'agents/src'),
      '@browser-ai/voice': path.resolve(packagesDir, 'voice/src'),
      '@browser-ai/telemetry': path.resolve(packagesDir, 'telemetry/src'),
    },
  },
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      preserveEntrySignatures: 'exports-only',
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});

import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Browser AI',
  description: 'Local-first form concierge with pluggable AI, STT, and TTS. MIT open source.',
  version: '0.1.0',
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Browser AI',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', 'file:///*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
  host_permissions: [
    'http://*/*',
    'https://*/*',
    'file:///*',
    'http://127.0.0.1:11434/*',
    'http://localhost:11434/*',
    'http://127.0.0.1:8090/*',
    'http://localhost:8090/*',
  ],
});

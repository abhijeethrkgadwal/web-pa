import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Browser AI',
  description: 'AI-powered browser assistant for intelligent form filling.',
  version: '0.0.1',
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
  host_permissions: ['http://*/*', 'https://*/*', 'file:///*'],
});

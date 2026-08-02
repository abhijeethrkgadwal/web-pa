import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { SidepanelApp } from './SidepanelApp';
import './sidepanel.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Sidepanel root element not found');
}

createRoot(root).render(
  <StrictMode>
    <SidepanelApp />
  </StrictMode>,
);

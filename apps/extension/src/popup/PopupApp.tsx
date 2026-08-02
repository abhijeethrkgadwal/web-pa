import { useState } from 'react';

import {
  MESSAGE_TYPES,
  type FillDemoResponse,
  type PingResponse,
  type RunPlanResponse,
  type ScanPageResponse,
} from '../shared/messages';
import { getActiveTab, sendToActiveTab } from '../shared/tabs';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ping'; response: PingResponse }
  | { kind: 'scan'; response: ScanPageResponse }
  | { kind: 'fill'; response: FillDemoResponse }
  | { kind: 'plan'; response: RunPlanResponse }
  | { kind: 'error'; message: string };

export function PopupApp() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handlePing() {
    setStatus({ kind: 'loading' });
    try {
      const response = await sendToActiveTab<PingResponse>({ type: MESSAGE_TYPES.PING });
      setStatus({ kind: 'ping', response });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to reach content script',
      });
    }
  }

  async function handleScan() {
    setStatus({ kind: 'loading' });
    try {
      const response = await sendToActiveTab<ScanPageResponse>({
        type: MESSAGE_TYPES.SCAN_PAGE,
      });
      setStatus({ kind: 'scan', response });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to scan page',
      });
    }
  }

  async function handleFillDemo() {
    setStatus({ kind: 'loading' });
    try {
      const response = await sendToActiveTab<FillDemoResponse>({
        type: MESSAGE_TYPES.FILL_DEMO,
      });
      setStatus({ kind: 'fill', response });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to fill demo values',
      });
    }
  }

  async function handleRunPlan() {
    setStatus({ kind: 'loading' });
    try {
      const response = await sendToActiveTab<RunPlanResponse>({
        type: MESSAGE_TYPES.RUN_PLAN,
      });
      setStatus({ kind: 'plan', response });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to run plan',
      });
    }
  }

  async function handleOpenSidepanel() {
    try {
      const tab = await getActiveTab();
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not open side panel',
      });
    }
  }

  function handleOpenOptions() {
    void chrome.runtime.openOptionsPage();
  }

  return (
    <main className="popup">
      <header className="popup__header">
        <h1 className="popup__title">Browser AI</h1>
        <p className="popup__subtitle">Phase 6 — voice + confirm</p>
      </header>

      <div className="popup__actions">
        <button className="popup__button" type="button" onClick={handleOpenSidepanel}>
          Open assistant
        </button>
      </div>

      <div className="popup__actions">
        <button
          className="popup__button popup__button--secondary"
          type="button"
          onClick={handleOpenOptions}
        >
          Profile
        </button>
        <button
          className="popup__button popup__button--secondary"
          type="button"
          onClick={handleRunPlan}
          disabled={status.kind === 'loading'}
        >
          Fill now
        </button>
        <button
          className="popup__button popup__button--secondary"
          type="button"
          onClick={handleScan}
          disabled={status.kind === 'loading'}
        >
          Scan
        </button>
        <button
          className="popup__button popup__button--secondary"
          type="button"
          onClick={handleFillDemo}
          disabled={status.kind === 'loading'}
        >
          Demo
        </button>
        <button
          className="popup__button popup__button--secondary"
          type="button"
          onClick={handlePing}
          disabled={status.kind === 'loading'}
        >
          Ping
        </button>
      </div>

      {status.kind === 'idle' && (
        <p className="popup__hint">
          Open assistant for voice/text + confirm-before-fill. “Fill now” skips
          confirmation.
        </p>
      )}

      {status.kind === 'ping' && (
        <div className="popup__result popup__result--ok" role="status">
          <strong>{status.response.message}</strong>
          <span>{status.response.href}</span>
        </div>
      )}

      {status.kind === 'scan' && (
        <div className="popup__result popup__result--ok" role="status">
          <strong>
            {status.response.fieldCount} fields · {status.response.forms} forms
          </strong>
        </div>
      )}

      {status.kind === 'fill' && (
        <div className="popup__result popup__result--ok" role="status">
          <strong>
            Filled {status.response.filled}/{status.response.attempted}
          </strong>
        </div>
      )}

      {status.kind === 'plan' && (
        <div
          className={
            status.response.success
              ? 'popup__result popup__result--ok'
              : 'popup__result popup__result--error'
          }
          role="status"
        >
          <strong>
            {status.response.completed}/{status.response.total} steps
          </strong>
          {status.response.error && <span>{status.response.error}</span>}
        </div>
      )}

      {status.kind === 'error' && (
        <div className="popup__result popup__result--error" role="alert">
          {status.message}
        </div>
      )}
    </main>
  );
}

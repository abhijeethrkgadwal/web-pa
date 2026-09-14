import { useEffect, useMemo, useRef, useState } from 'react';

import { createAIProviderFromSettings, resolveVoiceIntent } from '@browser-ai/ai';
import type { ConciergeFieldItem } from '@browser-ai/engine';
import { DEFAULT_AI_SETTINGS, getAiSettings, type AiSettings } from '@browser-ai/memory';
import { LocalMicRecognition, speakText } from '@browser-ai/voice';

import {
  isMicPermissionError,
  micPermissionHelpMessage,
  openMicrophonePermissionPage,
} from '../shared/micPermission';
import {
  MESSAGE_TYPES,
  type ConciergeConfirmResponse,
  type ConciergePreviewResponse,
  type ConciergeSubmitResponse,
} from '../shared/messages';
import { sendToActiveTab } from '../shared/tabs';

type Phase =
  | { kind: 'idle' }
  | { kind: 'listening' }
  | { kind: 'transcribing' }
  | { kind: 'loading' }
  | {
      kind: 'review';
      site: string;
      title: string;
      fields: ConciergeFieldItem[];
      knownCount: number;
      unknownCount: number;
      skippedUploadCount: number;
      submit?: { selector: string; label: string };
    }
  | {
      kind: 'done';
      completed: number;
      total: number;
      learned: number;
      submit?: { selector: string; label: string };
    }
  | { kind: 'submitted'; label?: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

export function SidepanelApp() {
  const [text, setText] = useState('Fill this form');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const recognitionRef = useRef<LocalMicRecognition | null>(null);

  const micSupported = useMemo(() => LocalMicRecognition.isSupported(), []);

  useEffect(() => {
    void getAiSettings()
      .then(setAiSettings)
      .catch(() => undefined);

    return () => {
      void recognitionRef.current?.stop().catch(() => undefined);
    };
  }, []);

  async function runConciergePreview(_transcript: string) {
    setPhase({ kind: 'loading' });
    try {
      const preview = await sendToActiveTab<ConciergePreviewResponse>({
        type: MESSAGE_TYPES.CONCIERGE_PREVIEW,
      });

      if (!preview.ok || preview.fields.length === 0) {
        setPhase({
          kind: 'error',
          message: preview.error ?? 'No form fields found on this page.',
        });
        return;
      }

      setPhase({
        kind: 'review',
        site: preview.site,
        title: preview.title,
        fields: preview.fields,
        knownCount: preview.knownCount,
        unknownCount: preview.unknownCount,
        skippedUploadCount: preview.skippedUploadCount,
        submit: preview.submit,
      });
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Concierge preview failed',
      });
    }
  }

  async function runPreview(transcript: string) {
    setPhase({ kind: 'loading' });

    try {
      const settings = await getAiSettings();
      setAiSettings(settings);

      const provider = createAIProviderFromSettings(settings);

      const intent = await resolveVoiceIntent(transcript, {
        useAi: Boolean(provider),
        provider,
      });

      if (
        intent.kind !== 'fill_personal_details' &&
        intent.kind !== 'scan_page' &&
        intent.kind !== 'unknown'
      ) {
        setPhase({
          kind: 'error',
          message: `Intent “${intent.kind}” is not wired yet.`,
        });
        return;
      }

      // fill / scan / unknown all open concierge review — user can edit.
      await runConciergePreview(transcript);
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Preview failed',
      });
    }
  }

  async function handleSubmitText() {
    await runPreview(text);
  }

  async function handleListen() {
    if (!micSupported) {
      setPhase({
        kind: 'error',
        message: 'Microphone is not available in this context.',
      });
      return;
    }

    if (phase.kind === 'listening' && recognitionRef.current) {
      setPhase({ kind: 'transcribing' });
      try {
        await recognitionRef.current.stop();
      } catch (error) {
        setPhase({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Could not stop recording',
        });
      }
      return;
    }

    const sttBaseUrl = aiSettings.sttBaseUrl ?? DEFAULT_AI_SETTINGS.sttBaseUrl!;
    const recognition = new LocalMicRecognition({
      baseUrl: sttBaseUrl,
      model: aiSettings.sttModel ?? DEFAULT_AI_SETTINGS.sttModel,
      apiKey: aiSettings.sttApiKey,
      language: 'en',
      maxDurationMs: 8_000,
    });
    recognitionRef.current = recognition;
    setPhase({ kind: 'listening' });

    recognition.onResult((command) => {
      if (!command.isFinal) {
        return;
      }
      setText(command.transcript);
      void runPreview(command.transcript);
    });
    recognition.onError((message) => {
      if (isMicPermissionError(new Error(message))) {
        openMicrophonePermissionPage();
        setPhase({ kind: 'error', message: micPermissionHelpMessage() });
        return;
      }
      setPhase({ kind: 'error', message });
    });

    try {
      await recognition.start({ sampleRate: 16_000, language: 'en' });
    } catch (error) {
      if (isMicPermissionError(error)) {
        openMicrophonePermissionPage();
        setPhase({ kind: 'error', message: micPermissionHelpMessage() });
        return;
      }
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not start microphone',
      });
    }
  }

  function updateFieldValue(selector: string, value: string) {
    if (phase.kind !== 'review') {
      return;
    }
    setPhase({
      ...phase,
      fields: phase.fields.map((field) =>
        field.selector === selector
          ? {
              ...field,
              value,
              status: value.trim() ? 'known' : 'unknown',
              source: 'user',
            }
          : field,
      ),
    });
  }

  async function handleConfirm() {
    if (phase.kind !== 'review') {
      return;
    }

    const { fields, site, submit } = phase;
    setPhase({ kind: 'loading' });

    try {
      const result = await sendToActiveTab<ConciergeConfirmResponse>({
        type: MESSAGE_TYPES.CONCIERGE_CONFIRM,
        fields,
        site,
      });

      if (!result.success) {
        setPhase({
          kind: 'error',
          message: result.error ?? 'Confirm fill failed',
        });
        return;
      }

      setPhase({
        kind: 'done',
        completed: result.completed,
        total: result.total,
        learned: result.learned,
        submit: result.submit ?? submit,
      });

      void speakText(
        `Filled ${result.completed} of ${result.total} fields.`,
        {
          provider: aiSettings.ttsProvider,
          baseUrl: aiSettings.ttsBaseUrl,
          model: aiSettings.ttsModel,
          voice: aiSettings.ttsVoice,
          apiKey: aiSettings.ttsApiKey || aiSettings.openaiApiKey,
        },
      ).catch(() => undefined);
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Confirm fill failed',
      });
    }
  }

  async function handleSubmitForm() {
    if (phase.kind !== 'done' || !phase.submit) {
      return;
    }
    const selector = phase.submit.selector;
    setPhase({ kind: 'loading' });
    try {
      const result = await sendToActiveTab<ConciergeSubmitResponse>({
        type: MESSAGE_TYPES.CONCIERGE_SUBMIT,
        selector,
      });
      if (!result.success) {
        setPhase({
          kind: 'error',
          message: result.error ?? 'Submit failed',
        });
        return;
      }
      setPhase({ kind: 'submitted', label: result.label });
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Submit failed',
      });
    }
  }

  async function handleCancel() {
    try {
      await sendToActiveTab({ type: MESSAGE_TYPES.CANCEL_FILL });
    } catch {
      // ignore
    }
    setPhase({ kind: 'cancelled' });
  }

  const busy =
    phase.kind === 'loading' ||
    phase.kind === 'listening' ||
    phase.kind === 'transcribing';

  return (
    <main className="sidepanel">
      <header className="sidepanel__header">
        <h1>Browser AI</h1>
        <p>Form concierge — review, fill, learn, submit</p>
      </header>

      <label className="sidepanel__label">
        Command
        <div className="sidepanel__row">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Fill this form"
            disabled={busy}
          />
          <button
            type="button"
            className="sidepanel__secondary"
            onClick={handleListen}
            disabled={!micSupported || phase.kind === 'loading' || phase.kind === 'transcribing'}
          >
            {phase.kind === 'listening'
              ? 'Stop'
              : phase.kind === 'transcribing'
                ? 'Transcribing…'
                : 'Mic'}
          </button>
        </div>
      </label>

      <button
        type="button"
        className="sidepanel__primary"
        onClick={handleSubmitText}
        disabled={busy}
      >
        {phase.kind === 'loading' ? 'Working…' : 'Review form'}
      </button>

      {phase.kind === 'idle' && (
        <p className="sidepanel__hint">
          Reviews this page’s questions, reuses answers you’ve confirmed before,
          asks only for unknowns, then fills after you approve. Uploads are skipped.
          Submit is offered only after a successful fill — never automatic.
        </p>
      )}

      {phase.kind === 'listening' && (
        <p className="sidepanel__hint">
          Listening… speak for 2–3 seconds, then click Stop.
        </p>
      )}

      {phase.kind === 'review' && (
        <section className="sidepanel__preview">
          <div className="sidepanel__preview-header">
            <strong>{phase.title || 'Form review'}</strong>
            <span>
              {phase.knownCount} known · {phase.unknownCount} ask ·{' '}
              {phase.skippedUploadCount} uploads skipped
            </span>
          </div>

          <ul className="sidepanel__field-list">
            {phase.fields.map((field) => (
              <li key={field.selector} className="sidepanel__field">
                <div className="sidepanel__field-meta">
                  <span>{field.label || field.name}</span>
                  <em>
                    {field.status === 'skipped_upload'
                      ? 'upload skipped'
                      : field.status === 'known'
                        ? field.source === 'user'
                          ? 'you'
                          : 'memory'
                        : 'needs answer'}
                  </em>
                </div>
                {field.status === 'skipped_upload' ? (
                  <p className="sidepanel__hint">File uploads are not handled yet.</p>
                ) : field.options && field.options.length > 0 ? (
                  <select
                    value={field.value ?? ''}
                    onChange={(event) => updateFieldValue(field.selector, event.target.value)}
                  >
                    <option value="">Select</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' || field.type === 'radio' ? (
                  <select
                    value={field.value ?? ''}
                    onChange={(event) => updateFieldValue(field.selector, event.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="true">Yes / checked</option>
                    <option value="false">No / unchecked</option>
                  </select>
                ) : (
                  <input
                    value={field.value ?? ''}
                    onChange={(event) => updateFieldValue(field.selector, event.target.value)}
                    placeholder={field.required ? 'Required — enter value' : 'Optional'}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="sidepanel__actions">
            <button type="button" className="sidepanel__primary" onClick={handleConfirm}>
              Confirm fill
            </button>
            <button type="button" className="sidepanel__secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {phase.kind === 'done' && (
        <section className="sidepanel__preview">
          <div className="sidepanel__status sidepanel__status--ok" role="status">
            Filled {phase.completed}/{phase.total} · learned {phase.learned} answers
          </div>
          {phase.submit ? (
            <div className="sidepanel__actions">
              <button type="button" className="sidepanel__primary" onClick={handleSubmitForm}>
                {phase.submit.label || 'Submit form'}
              </button>
              <button
                type="button"
                className="sidepanel__secondary"
                onClick={() => setPhase({ kind: 'idle' })}
              >
                Done
              </button>
            </div>
          ) : (
            <p className="sidepanel__hint">No submit button detected — submit manually if needed.</p>
          )}
        </section>
      )}

      {phase.kind === 'submitted' && (
        <div className="sidepanel__status sidepanel__status--ok" role="status">
          Clicked “{phase.label || 'Submit'}”. Check the page for the next step.
        </div>
      )}

      {phase.kind === 'cancelled' && (
        <div className="sidepanel__status sidepanel__status--ok" role="status">
          Cancelled — page left untouched.
        </div>
      )}

      {phase.kind === 'error' && (
        <div className="sidepanel__status sidepanel__status--error" role="alert">
          {phase.message}
        </div>
      )}
    </main>
  );
}

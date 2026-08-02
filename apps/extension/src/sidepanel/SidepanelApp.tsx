import { useEffect, useMemo, useRef, useState } from 'react';

import type { FieldMapping } from '@browser-ai/contracts';
import {
  isSpeechRecognitionSupported,
  parseVoiceIntent,
  WebSpeechRecognition,
} from '@browser-ai/voice';

import {
  MESSAGE_TYPES,
  type ConfirmFillResponse,
  type PreviewFillResponse,
} from '../shared/messages';
import { sendToActiveTab } from '../shared/tabs';

type MissingField = NonNullable<PreviewFillResponse['missingFields']>[number];

type Phase =
  | { kind: 'idle' }
  | { kind: 'listening' }
  | { kind: 'loading' }
  | {
      kind: 'ask_missing';
      mappings: FieldMapping[];
      missingFields: MissingField[];
      source: 'heuristic' | 'ai';
      transcript: string;
      answers: Record<string, string>;
    }
  | {
      kind: 'preview';
      mappings: FieldMapping[];
      source: 'heuristic' | 'ai';
      transcript: string;
    }
  | { kind: 'done'; completed: number; total: number; source?: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

export function SidepanelApp() {
  const [text, setText] = useState('Fill my personal details');
  const [interim, setInterim] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);

  const speechSupported = useMemo(() => isSpeechRecognitionSupported(), []);

  useEffect(() => {
    return () => {
      void recognitionRef.current?.stop();
    };
  }, []);

  async function runPreview(transcript: string) {
    const intent = parseVoiceIntent(transcript);
    if (intent.kind === 'unknown') {
      setPhase({
        kind: 'error',
        message: `Unrecognized command: “${transcript}”. Try “Fill my personal details”.`,
      });
      return;
    }

    if (intent.kind !== 'fill_personal_details') {
      setPhase({
        kind: 'error',
        message: `Intent “${intent.kind}” is not wired in the sidepanel yet.`,
      });
      return;
    }

    setPhase({ kind: 'loading' });
    try {
      const preview = await sendToActiveTab<PreviewFillResponse>({
        type: MESSAGE_TYPES.PREVIEW_FILL,
      });

      const missingFields = preview.missingFields ?? [];

      if (!preview.ok && preview.mappings.length === 0 && missingFields.length === 0) {
        setPhase({
          kind: 'error',
          message: preview.error ?? 'No mappings to confirm.',
        });
        return;
      }

      if (missingFields.length > 0) {
        setPhase({
          kind: 'ask_missing',
          mappings: preview.mappings,
          missingFields,
          source: preview.mappingSource,
          transcript,
          answers: {},
        });
        return;
      }

      if (preview.mappings.length === 0) {
        setPhase({
          kind: 'error',
          message: preview.error ?? 'No mappings to confirm.',
        });
        return;
      }

      setPhase({
        kind: 'preview',
        mappings: preview.mappings,
        source: preview.mappingSource,
        transcript,
      });
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
    if (!speechSupported) {
      setPhase({
        kind: 'error',
        message: 'Web Speech API is not supported in this browser.',
      });
      return;
    }

    const recognition = new WebSpeechRecognition();
    recognitionRef.current = recognition;
    setInterim('');
    setPhase({ kind: 'listening' });

    recognition.onResult((command) => {
      setInterim(command.transcript);
      if (!command.isFinal) {
        return;
      }

      setText(command.transcript);
      void recognition.stop();
      void runPreview(command.transcript);
    });

    try {
      await recognition.start({ sampleRate: 16000, language: 'en-US' });
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not start microphone',
      });
    }
  }

  function continueAfterMissing() {
    if (phase.kind !== 'ask_missing') {
      return;
    }

    const extras: FieldMapping[] = [];
    for (const field of phase.missingFields) {
      const value = phase.answers[field.selector]?.trim();
      if (!value) {
        continue;
      }
      extras.push({
        selector: field.selector,
        value,
        source: 'heuristic',
        fieldName: field.name,
        fieldLabel: field.label,
        confidence: 1,
      });
    }

    const mappings = [...phase.mappings, ...extras];
    if (mappings.length === 0) {
      setPhase({
        kind: 'error',
        message: 'Add at least one missing value, or cancel.',
      });
      return;
    }

    setPhase({
      kind: 'preview',
      mappings,
      source: phase.source,
      transcript: phase.transcript,
    });
  }

  async function handleConfirm() {
    if (phase.kind !== 'preview') {
      return;
    }

    const mappings = phase.mappings;
    setPhase({ kind: 'loading' });

    try {
      const result = await sendToActiveTab<ConfirmFillResponse>({
        type: MESSAGE_TYPES.CONFIRM_FILL,
        mappings,
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
        source: result.mappingSource,
      });
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Confirm fill failed',
      });
    }
  }

  async function handleCancel() {
    try {
      await sendToActiveTab({ type: MESSAGE_TYPES.CANCEL_FILL });
    } catch {
      // Cancel should still clear local preview even if messaging fails.
    }
    setPhase({ kind: 'cancelled' });
  }

  return (
    <main className="sidepanel">
      <header className="sidepanel__header">
        <h1>Browser AI</h1>
        <p>Phase 7 — confirm, ask missing, retry</p>
      </header>

      <label className="sidepanel__label">
        Command
        <div className="sidepanel__row">
          <input
            value={phase.kind === 'listening' && interim ? interim : text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Fill my personal details"
            disabled={phase.kind === 'loading' || phase.kind === 'listening'}
          />
          <button
            type="button"
            className="sidepanel__secondary"
            onClick={handleListen}
            disabled={!speechSupported || phase.kind === 'loading' || phase.kind === 'listening'}
          >
            {phase.kind === 'listening' ? 'Listening…' : 'Mic'}
          </button>
        </div>
      </label>

      <button
        type="button"
        className="sidepanel__primary"
        onClick={handleSubmitText}
        disabled={phase.kind === 'loading' || phase.kind === 'listening'}
      >
        {phase.kind === 'loading' ? 'Working…' : 'Preview fill'}
      </button>

      {!speechSupported && (
        <p className="sidepanel__hint">Voice unavailable here — use text input.</p>
      )}

      {phase.kind === 'idle' && (
        <p className="sidepanel__hint">
          Say or type “Fill my personal details”. Review proposed values, answer any
          missing required fields once, then Confirm. Cancel leaves the page unchanged.
        </p>
      )}

      {phase.kind === 'ask_missing' && (
        <section className="sidepanel__preview">
          <div className="sidepanel__preview-header">
            <strong>Missing required fields</strong>
            <span>answer once</span>
          </div>
          {phase.missingFields.map((field) => (
            <label key={field.selector} className="sidepanel__label">
              {field.label || field.name}
              <input
                value={phase.answers[field.selector] ?? ''}
                onChange={(event) =>
                  setPhase({
                    ...phase,
                    answers: {
                      ...phase.answers,
                      [field.selector]: event.target.value,
                    },
                  })
                }
                placeholder="Enter value"
              />
            </label>
          ))}
          <div className="sidepanel__actions">
            <button type="button" className="sidepanel__primary" onClick={continueAfterMissing}>
              Continue
            </button>
            <button type="button" className="sidepanel__secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {phase.kind === 'preview' && (
        <section className="sidepanel__preview">
          <div className="sidepanel__preview-header">
            <strong>Proposed fills</strong>
            <span>
              {phase.source} · {phase.mappings.length} fields
            </span>
          </div>
          <ul>
            {phase.mappings.map((mapping) => (
              <li key={mapping.selector}>
                <span>{mapping.fieldLabel || mapping.fieldName || mapping.selector}</span>
                <strong>{mapping.value}</strong>
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
        <div className="sidepanel__status sidepanel__status--ok" role="status">
          Filled {phase.completed}/{phase.total}
          {phase.source ? ` · ${phase.source}` : ''}
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

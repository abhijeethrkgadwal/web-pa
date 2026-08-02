import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import {
  clearUserProfile,
  getAiSettings,
  getUserProfile,
  saveAiSettings,
  saveUserProfile,
  type AiSettings,
  type UserProfile,
} from '@browser-ai/memory';

type Status =
  | { kind: 'idle' }
  | { kind: 'saved' }
  | { kind: 'cleared' }
  | { kind: 'error'; message: string };

const EMPTY_FORM: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  summary: '',
  willingToRelocate: false,
};

export function OptionsApp() {
  const [form, setForm] = useState<UserProfile>(EMPTY_FORM);
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    enabled: false,
    provider: 'heuristic',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
  });
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([getUserProfile(), getAiSettings()])
      .then(([profile, settings]) => {
        setForm({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          country: profile.country ?? '',
          summary: profile.summary ?? '',
          willingToRelocate: Boolean(profile.willingToRelocate),
        });
        setAiSettings(settings);
      })
      .catch((error: unknown) => {
        setStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Failed to load settings',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: 'idle' });

    try {
      await saveUserProfile({
        firstName: form.firstName?.trim() || undefined,
        lastName: form.lastName?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        country: form.country?.trim() || undefined,
        summary: form.summary?.trim() || undefined,
        willingToRelocate: Boolean(form.willingToRelocate),
      });
      await saveAiSettings({
        enabled: aiSettings.enabled,
        provider: aiSettings.enabled ? 'ollama' : 'heuristic',
        ollamaBaseUrl: aiSettings.ollamaBaseUrl,
        ollamaModel: aiSettings.ollamaModel,
      });
      setStatus({ kind: 'saved' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to save',
      });
    }
  }

  async function handleClear() {
    try {
      await clearUserProfile();
      setForm(EMPTY_FORM);
      setStatus({ kind: 'cleared' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to clear profile',
      });
    }
  }

  if (loading) {
    return (
      <main className="options">
        <p>Loading profile…</p>
      </main>
    );
  }

  return (
    <main className="options">
      <header className="options__header">
        <h1>Browser AI Profile</h1>
        <p>Saved locally. Used by smart fill (scan → map → fill).</p>
      </header>

      <form className="options__form" onSubmit={handleSubmit}>
        <label>
          First name
          <input
            value={form.firstName ?? ''}
            onChange={(event) => update('firstName', event.target.value)}
            autoComplete="given-name"
          />
        </label>

        <label>
          Last name
          <input
            value={form.lastName ?? ''}
            onChange={(event) => update('lastName', event.target.value)}
            autoComplete="family-name"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(event) => update('email', event.target.value)}
            autoComplete="email"
          />
        </label>

        <label>
          Phone
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
          />
        </label>

        <label>
          Country code
          <select
            value={form.country ?? ''}
            onChange={(event) => update('country', event.target.value)}
          >
            <option value="">Select</option>
            <option value="in">India (in)</option>
            <option value="us">United States (us)</option>
          </select>
        </label>

        <label>
          Summary
          <textarea
            rows={4}
            value={form.summary ?? ''}
            onChange={(event) => update('summary', event.target.value)}
          />
        </label>

        <label className="options__checkbox">
          <input
            type="checkbox"
            checked={Boolean(form.willingToRelocate)}
            onChange={(event) => update('willingToRelocate', event.target.checked)}
          />
          Willing to relocate
        </label>

        <section className="options__ai">
          <h2>AI mapping</h2>
          <p>
            Off by default (heuristics). Enable to try Ollama first; if it fails,
            heuristics still run.
          </p>
          <label className="options__checkbox">
            <input
              type="checkbox"
              checked={aiSettings.enabled}
              onChange={(event) =>
                setAiSettings((current) => ({
                  ...current,
                  enabled: event.target.checked,
                  provider: event.target.checked ? 'ollama' : 'heuristic',
                }))
              }
            />
            Use Ollama for field mapping
          </label>
          {aiSettings.enabled && (
            <>
              <label>
                Ollama base URL
                <input
                  value={aiSettings.ollamaBaseUrl ?? ''}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      ollamaBaseUrl: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Model
                <input
                  value={aiSettings.ollamaModel ?? ''}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      ollamaModel: event.target.value,
                    }))
                  }
                />
              </label>
            </>
          )}
        </section>

        <div className="options__actions">
          <button type="submit">Save</button>
          <button type="button" className="options__secondary" onClick={handleClear}>
            Clear profile
          </button>
        </div>
      </form>

      {status.kind === 'saved' && (
        <p className="options__status options__status--ok" role="status">
          Saved locally.
        </p>
      )}
      {status.kind === 'cleared' && (
        <p className="options__status options__status--ok" role="status">
          Profile cleared.
        </p>
      )}
      {status.kind === 'error' && (
        <p className="options__status options__status--error" role="alert">
          {status.message}
        </p>
      )}
    </main>
  );
}

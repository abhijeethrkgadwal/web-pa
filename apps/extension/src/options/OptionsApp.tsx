import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import {
  clearUserProfile,
  getAiSettings,
  getUserProfile,
  saveAiSettings,
  saveUserProfile,
  type AiProviderId,
  type AiSettings,
  type TtsProviderId,
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
  address: {
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
};

export function OptionsApp() {
  const [form, setForm] = useState<UserProfile>(EMPTY_FORM);
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    enabled: false,
    provider: 'heuristic',
    ollamaBaseUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'llama3.2',
    openaiBaseUrl: 'https://api.openai.com',
    openaiModel: 'gpt-4o-mini',
    openaiApiKey: '',
    anthropicBaseUrl: 'https://api.anthropic.com',
    anthropicModel: 'claude-3-5-haiku-latest',
    anthropicApiKey: '',
    sttBaseUrl: 'http://127.0.0.1:8090',
    sttModel: 'Xenova/whisper-tiny.en',
    sttApiKey: '',
    ttsProvider: 'none',
    ttsBaseUrl: 'https://api.openai.com',
    ttsModel: 'gpt-4o-mini-tts',
    ttsVoice: 'alloy',
    ttsApiKey: '',
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
          address: {
            line1: profile.address?.line1 ?? '',
            city: profile.address?.city ?? '',
            state: profile.address?.state ?? '',
            postalCode: profile.address?.postalCode ?? '',
            country: profile.address?.country ?? '',
          },
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

  function updateAddress(key: keyof NonNullable<UserProfile['address']>, value: string) {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [key]: value,
      },
    }));
  }

  function patchAi<K extends keyof AiSettings>(key: K, value: AiSettings[K]) {
    setAiSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: 'idle' });

    try {
      const addressLine1 = form.address?.line1?.trim() || undefined;
      const addressCity = form.address?.city?.trim() || undefined;
      const addressState = form.address?.state?.trim() || undefined;
      const addressPostal = form.address?.postalCode?.trim() || undefined;
      const addressCountry = form.address?.country?.trim() || undefined;
      const hasAddress = Boolean(
        addressLine1 || addressCity || addressState || addressPostal || addressCountry,
      );

      await saveUserProfile({
        firstName: form.firstName?.trim() || undefined,
        lastName: form.lastName?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        country: form.country?.trim() || undefined,
        summary: form.summary?.trim() || undefined,
        willingToRelocate: Boolean(form.willingToRelocate),
        address: hasAddress
          ? {
              line1: addressLine1,
              city: addressCity,
              state: addressState,
              postalCode: addressPostal,
              country: addressCountry,
            }
          : undefined,
      });
      await saveAiSettings({
        ...aiSettings,
        enabled: aiSettings.enabled && aiSettings.provider !== 'heuristic',
        openaiApiKey: aiSettings.openaiApiKey?.trim() || '',
        anthropicApiKey: aiSettings.anthropicApiKey?.trim() || '',
        sttApiKey: aiSettings.sttApiKey?.trim() || '',
        ttsApiKey: aiSettings.ttsApiKey?.trim() || '',
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

  const provider = aiSettings.provider;
  const showCloudAi = aiSettings.enabled && (provider === 'openai' || provider === 'anthropic');
  const showOllama = aiSettings.enabled && provider === 'ollama';
  const showTtsCloud = aiSettings.ttsProvider === 'openai';

  return (
    <main className="options">
      <header className="options__header">
        <h1>Browser AI Profile</h1>
        <p>
          Saved locally on this device. Used by smart fill and the form concierge.
          Optional third-party AI / TTS keys never leave your browser except to the
          provider URL you configure.
        </p>
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

        <section className="options__ai">
          <h2>Address</h2>
          <p>Used when forms ask for street, city, state, or postal code.</p>
          <label>
            Street address
            <input
              value={form.address?.line1 ?? ''}
              onChange={(event) => updateAddress('line1', event.target.value)}
              autoComplete="address-line1"
            />
          </label>
          <label>
            City
            <input
              value={form.address?.city ?? ''}
              onChange={(event) => updateAddress('city', event.target.value)}
              autoComplete="address-level2"
            />
          </label>
          <label>
            State / region
            <input
              value={form.address?.state ?? ''}
              onChange={(event) => updateAddress('state', event.target.value)}
              autoComplete="address-level1"
            />
          </label>
          <label>
            Postal / ZIP code
            <input
              value={form.address?.postalCode ?? ''}
              onChange={(event) => updateAddress('postalCode', event.target.value)}
              autoComplete="postal-code"
            />
          </label>
          <label>
            Address country
            <input
              value={form.address?.country ?? ''}
              onChange={(event) => updateAddress('country', event.target.value)}
              autoComplete="country-name"
              placeholder="Optional (falls back to country code above)"
            />
          </label>
        </section>

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
          <h2>Speech-to-text</h2>
          <p>
            Default: local Whisper (<code>pnpm serve:stt</code>). Point the base URL at
            any OpenAI-compatible transcription API (OpenAI Whisper, Groq, etc.) and
            optionally set an API key.
          </p>
          <label>
            STT base URL
            <input
              value={aiSettings.sttBaseUrl ?? ''}
              onChange={(event) => patchAi('sttBaseUrl', event.target.value)}
              placeholder="http://127.0.0.1:8090"
            />
          </label>
          <label>
            STT model
            <input
              value={aiSettings.sttModel ?? ''}
              onChange={(event) => patchAi('sttModel', event.target.value)}
              placeholder="Xenova/whisper-tiny.en"
            />
          </label>
          <label>
            STT API key (optional)
            <input
              type="password"
              autoComplete="off"
              value={aiSettings.sttApiKey ?? ''}
              onChange={(event) => patchAi('sttApiKey', event.target.value)}
              placeholder="Only for cloud STT"
            />
          </label>
        </section>

        <section className="options__ai">
          <h2>Language model</h2>
          <p>
            Heuristics always work offline. Enable a provider for smarter intent parsing
            and field mapping. Keys are stored in Chrome local storage only.
          </p>
          <label className="options__checkbox">
            <input
              type="checkbox"
              checked={aiSettings.enabled}
              onChange={(event) =>
                setAiSettings((current) => ({
                  ...current,
                  enabled: event.target.checked,
                  provider: event.target.checked
                    ? current.provider === 'heuristic'
                      ? 'ollama'
                      : current.provider
                    : 'heuristic',
                }))
              }
            />
            Use an AI provider for intent + field mapping
          </label>

          {aiSettings.enabled && (
            <>
              <label>
                Provider
                <select
                  value={provider}
                  onChange={(event) =>
                    patchAi('provider', event.target.value as AiProviderId)
                  }
                >
                  <option value="ollama">Ollama (local)</option>
                  <option value="openai">OpenAI-compatible (OpenAI, Groq, LM Studio…)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </label>

              {showOllama && (
                <>
                  <label>
                    Ollama base URL
                    <input
                      value={aiSettings.ollamaBaseUrl ?? ''}
                      onChange={(event) => patchAi('ollamaBaseUrl', event.target.value)}
                    />
                  </label>
                  <label>
                    Ollama model
                    <input
                      value={aiSettings.ollamaModel ?? ''}
                      onChange={(event) => patchAi('ollamaModel', event.target.value)}
                    />
                  </label>
                </>
              )}

              {showCloudAi && provider === 'openai' && (
                <>
                  <label>
                    Chat base URL
                    <input
                      value={aiSettings.openaiBaseUrl ?? ''}
                      onChange={(event) => patchAi('openaiBaseUrl', event.target.value)}
                      placeholder="https://api.openai.com"
                    />
                  </label>
                  <label>
                    Chat model
                    <input
                      value={aiSettings.openaiModel ?? ''}
                      onChange={(event) => patchAi('openaiModel', event.target.value)}
                    />
                  </label>
                  <label>
                    API key
                    <input
                      type="password"
                      autoComplete="off"
                      value={aiSettings.openaiApiKey ?? ''}
                      onChange={(event) => patchAi('openaiApiKey', event.target.value)}
                    />
                  </label>
                </>
              )}

              {showCloudAi && provider === 'anthropic' && (
                <>
                  <label>
                    Anthropic base URL
                    <input
                      value={aiSettings.anthropicBaseUrl ?? ''}
                      onChange={(event) =>
                        patchAi('anthropicBaseUrl', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Claude model
                    <input
                      value={aiSettings.anthropicModel ?? ''}
                      onChange={(event) => patchAi('anthropicModel', event.target.value)}
                    />
                  </label>
                  <label>
                    API key
                    <input
                      type="password"
                      autoComplete="off"
                      value={aiSettings.anthropicApiKey ?? ''}
                      onChange={(event) => patchAi('anthropicApiKey', event.target.value)}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </section>

        <section className="options__ai">
          <h2>Text-to-speech (optional)</h2>
          <p>
            Speak a short confirmation after fill. Use the browser voice pack (offline)
            or any OpenAI-compatible <code>/v1/audio/speech</code> endpoint.
          </p>
          <label>
            TTS provider
            <select
              value={aiSettings.ttsProvider ?? 'none'}
              onChange={(event) =>
                patchAi('ttsProvider', event.target.value as TtsProviderId)
              }
            >
              <option value="none">Off</option>
              <option value="browser">Browser speechSynthesis</option>
              <option value="openai">OpenAI-compatible TTS</option>
            </select>
          </label>
          {showTtsCloud && (
            <>
              <label>
                TTS base URL
                <input
                  value={aiSettings.ttsBaseUrl ?? ''}
                  onChange={(event) => patchAi('ttsBaseUrl', event.target.value)}
                />
              </label>
              <label>
                TTS model
                <input
                  value={aiSettings.ttsModel ?? ''}
                  onChange={(event) => patchAi('ttsModel', event.target.value)}
                />
              </label>
              <label>
                Voice
                <input
                  value={aiSettings.ttsVoice ?? ''}
                  onChange={(event) => patchAi('ttsVoice', event.target.value)}
                />
              </label>
              <label>
                TTS API key (falls back to OpenAI chat key)
                <input
                  type="password"
                  autoComplete="off"
                  value={aiSettings.ttsApiKey ?? ''}
                  onChange={(event) => patchAi('ttsApiKey', event.target.value)}
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

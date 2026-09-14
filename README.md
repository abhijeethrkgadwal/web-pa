# Browser AI

**Local-first Chrome extension that reads web forms, remembers your answers, and fills them — by text or voice — with you always in control.**

No cloud backend required. Your profile and answer memory stay on your device. Optional third-party AI, speech-to-text, and text-to-speech providers plug in when you want smarter mapping or faster voice — you choose the endpoint and the key.

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspaces-f69220.svg)](https://pnpm.io/)

---

## Why this exists

Job applications, contact forms, and onboarding wizards ask for the same fields again and again. Browser AI turns that grind into:

1. **Scan** the visible form  
2. **Recall** answers you already gave (or your saved profile)  
3. **Review** known vs unknown fields in the side panel  
4. **Confirm** before anything is written to the page  
5. **Learn** answers for next time  
6. **Submit** only if *you* click — never automatic  

Voice is optional: hold the mic, speak naturally, and a local Whisper server (or any OpenAI-compatible STT) turns speech into the same review flow.

---

## What works today (Phases 0–8)

| Phase | Capability | Status |
|------:|------------|--------|
| 0 | Extension boots (popup ↔ content script) | Done |
| 1 | Page scanner → semantic field model | Done |
| 2 | Browser controller DOM actions | Done |
| 3 | Commands + Engine orchestration | Done |
| 4 | Local profile memory (`chrome.storage`) | Done |
| 5 | Smart fill mapping (heuristics + AI providers) | Done |
| 6 | Voice / text + confirm-before-fill | Done |
| 7 | Retries, ask-missing-once, Playwright e2e | Done |
| 8 | Form concierge: answer memory, review, learn, optional submit | Done |
| — | Pluggable LLM / STT / TTS (Ollama, OpenAI-compatible, Anthropic, browser TTS) | Done |
| — | `scan_page` intent, address Options, CI | Done |

---

## Quick start

### Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/) 9
- Google Chrome (or Chromium) for the extension
- Optional: [Ollama](https://ollama.com) for local LLM
- Optional: API keys for OpenAI / Anthropic / Groq / etc.

### Install & build

```bash
pnpm install
pnpm build:extension
```

### Load the extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → `apps/extension/dist`
4. For local HTML fixtures, enable **Allow access to file URLs**  
   (or serve fixtures over HTTP — preferred)

### Demo fixtures

```bash
pnpm serve:fixtures
```

Open:

- http://localhost:4173/job-application.html  
- http://localhost:4173/contact-form.html  

### Full local AI demo

1. `pnpm install`
2. `pnpm serve:stt` — first run downloads Whisper weights  
3. Optional: `ollama pull llama3.2` and keep Ollama running  
4. `pnpm build:extension` → reload unpacked from `apps/extension/dist`  
5. **Options** → set STT URL (`http://127.0.0.1:8090`), optionally enable Ollama / OpenAI / Anthropic, optionally enable TTS  
6. **Popup → Profile** → save First name, Email, Country (`in`), Summary, Willing to relocate  
7. Open the job-application fixture  
8. **Popup → Open assistant**  
9. Click **Review form** (or Mic)  
10. Edit answers → **Confirm fill**  
11. Optionally click offered **Submit** (never automatic)  

---

## What you can do with it

| Use case | How |
|----------|-----|
| Fill a job application from your profile | Popup **Fill now** or Sidepanel **Review form** |
| Teach the assistant site-specific answers | Edit unknowns in review → Confirm → answers are learned |
| Voice-driven form help | Mic → local/cloud STT → intent → concierge review |
| Offline-only usage | Leave AI disabled; heuristics + memory still work |
| Faster / smarter mapping | Enable Ollama, OpenAI-compatible, or Anthropic in Options |
| Spoken confirmation | Enable browser TTS or OpenAI-compatible TTS in Options |
| Custom LLM gateway | Set OpenAI base URL to Groq, OpenRouter, LM Studio, vLLM, Azure gateways… |
| Custom Whisper / STT | Point STT base URL at any OpenAI-compatible `/v1/audio/transcriptions` |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│  Chrome extension (apps/extension)                              │
│  Popup · Options · Sidepanel · Content script · Background SW   │
└─────────────┬───────────────────────────────┬───────────────────┘
              │ chrome.tabs messages          │ fetch (optional)
              ▼                               ▼
┌─────────────────────────────┐    ┌──────────────────────────────┐
│  Content script             │    │  Optional providers          │
│  scanForms / fill / submit  │    │  Ollama · OpenAI · Anthropic │
│  Engine · ConciergeAgent    │    │  Local Whisper STT · TTS     │
│  chrome.storage.local       │    └──────────────────────────────┘
└─────────────────────────────┘
```

### Monorepo layout

```text
apps/extension/          Chrome MV3 app (CRXJS + Vite + React)
services/stt/            Local Whisper STT (OpenAI-compatible HTTP)
packages/
  contracts/             Shared TypeScript contracts (AI, voice, memory, commands)
  browser/               DOM scan + actions
  engine/                Smart fill + concierge orchestration
  agents/                FormAgent, ConciergeAgent, PlannerAgent
  ai/                    Providers, field mapper, voice intent
  voice/                 Mic recorder, STT client, TTS, intent parse
  memory/                Profile, AI settings, answer memory
  commands/              FillField, SelectOption, ClickButton, …
  shared/                PageField / PageModel types
  …                      Scaffold packages (security, ui, workflows, …)
tests/unit|e2e/          Vitest + Playwright
```

---

## Privacy & safety model

- **No Browser AI cloud.** There is no first-party backend that receives your profile.
- **Local storage only** for profile, answer memory, and settings (`chrome.storage.local`).
- **Confirm before fill.** Concierge never writes fields until you confirm.
- **Submit is never automatic.** Detected submit controls are offered as a button you click.
- **Password & file fields** are skipped by the concierge (uploads listed but not filled).
- **Third-party keys** (OpenAI, Anthropic, …) stay on-device and are only sent to the base URL *you* configure.
- Prefer **Ollama + local Whisper** when you want zero cloud traffic.

---

## Provider integration (LLM · STT · TTS)

Browser AI is built around small contracts so you can swap models without rewriting the form pipeline.

### Contracts

```ts
// packages/contracts — AI
interface AIProvider {
  readonly name: string;
  generate(messages: AIMessage[]): Promise<string>;
}

// packages/contracts — STT
interface SpeechToTextProvider {
  transcribe(audio: Blob, options?: Partial<SpeechToTextOptions>): Promise<TranscriptionResult>;
}

// packages/contracts — TTS
interface TextToSpeechProvider {
  readonly name: string;
  speak(text: string, options?: Partial<TextToSpeechOptions>): Promise<TextToSpeechResult | void>;
  stop?(): void;
}
```

### Built-in LLM providers

| Id | Class | Protocol | Typical use |
|----|-------|----------|-------------|
| `heuristic` | — | offline rules | Default, always available |
| `ollama` | `OllamaProvider` | `POST /api/chat` | Fully local |
| `openai` | `OpenAICompatibleProvider` | `POST /v1/chat/completions` | OpenAI, Groq, Together, OpenRouter, LM Studio, vLLM… |
| `anthropic` | `AnthropicProvider` | `POST /v1/messages` | Claude |
| *(code)* | `GeminiProvider` | OpenAI-compatible Gemini endpoint | Wire via custom settings / factory |

Factory used by the extension and engine:

```ts
import { createAIProviderFromSettings } from '@browser-ai/ai';

const provider = createAIProviderFromSettings(await getAiSettings());
```

### Built-in STT

| Path | How |
|------|-----|
| Local Whisper | `pnpm serve:stt` → `http://127.0.0.1:8090/v1/audio/transcriptions` |
| Cloud / gateway | Set **STT base URL** + optional **STT API key** in Options |

Client: `transcribeWithOpenAiCompatible(audio, { baseUrl, model, apiKey })`.

### Built-in TTS

| Id | Class | Notes |
|----|-------|-------|
| `none` | — | Default |
| `browser` | `BrowserSpeechSynthesisProvider` | Offline `speechSynthesis` |
| `openai` | `OpenAICompatibleTtsProvider` | `POST /v1/audio/speech` |

Helper: `speakText(text, { provider, baseUrl, model, voice, apiKey })`.

### Settings schema (`AiSettings`)

Persisted under key `ai-settings`:

| Field | Purpose |
|-------|---------|
| `enabled` / `provider` | `heuristic` \| `ollama` \| `openai` \| `anthropic` |
| `ollamaBaseUrl` / `ollamaModel` | Local Ollama |
| `openaiBaseUrl` / `openaiModel` / `openaiApiKey` | OpenAI-compatible chat |
| `anthropicBaseUrl` / `anthropicModel` / `anthropicApiKey` | Claude |
| `sttBaseUrl` / `sttModel` / `sttApiKey` | Whisper / compatible STT |
| `ttsProvider` / `ttsBaseUrl` / `ttsModel` / `ttsVoice` / `ttsApiKey` | Spoken feedback |

Configure everything in **extension Options**.

### Add your own provider (5-minute recipe)

1. Implement `AIProvider` (or STT / TTS contracts) in `packages/ai` or `packages/voice`.
2. Export it from the package index.
3. Extend `AiProviderId` / `TtsProviderId` in `packages/memory/src/schema/AiSettings.ts`.
4. Teach `createAIProviderFromSettings` (or `createTtsProvider`) about the new id.
5. Add an Options UI row.
6. Ship a unit test that mocks `fetch`.

Example custom LLM:

```ts
import type { AIMessage, AIProvider } from '@browser-ai/contracts';

export class MyGatewayProvider implements AIProvider {
  readonly name = 'my-gateway';
  constructor(private readonly url: string, private readonly key: string) {}

  async generate(messages: AIMessage[]): Promise<string> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.key}`,
      },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { text: string };
    return data.text;
  }
}
```

---

## Extension messaging API

Content script protocol (`apps/extension/src/shared/messages.ts`):

| Message type | Direction | Purpose |
|--------------|-----------|---------|
| `browser-ai:ping` | UI → content | Health check |
| `browser-ai:scan-page` | UI → content | Scan visible fields |
| `browser-ai:fill-demo` | UI → content | Demo hardcoded fill |
| `browser-ai:run-plan` | UI → content | Legacy smart fill (profile → map → fill) |
| `browser-ai:preview-fill` | UI → content | Preview mappings without writing |
| `browser-ai:confirm-fill` | UI → content | Apply previewed mappings |
| `browser-ai:cancel-fill` | UI → content | Cancel preview |
| `browser-ai:concierge-preview` | UI → content | Scan + recall answer memory |
| `browser-ai:concierge-confirm` | UI → content | Fill + learn answers |
| `browser-ai:concierge-submit` | UI → content | Click detected submit (user-triggered) |

### Engine APIs (`@browser-ai/engine`)

| Function | Role |
|----------|------|
| `previewSmartFill` / `confirmSmartFill` / `runSmartFill` | Profile-based fill |
| `previewConcierge` / `confirmConcierge` / `submitConciergeForm` | Review → fill → learn → optional submit |
| `Engine.run(plan)` | Execute command plan with retries |

### Command names (`@browser-ai/commands`)

`FillField` · `SelectOption` · `ClickButton` · `FocusField` · `ScrollPage`

### Local STT HTTP API (`services/stt`)

| Endpoint | Body | Response |
|----------|------|----------|
| `GET /health` | — | `{ ok, model }` |
| `POST /v1/audio/transcriptions` | JSON `{ audio_base64, model?, language? }` or multipart file | `{ text }` |

Binds to `127.0.0.1` by default (`PORT=8090`).

---

## Form concierge flow

```text
Mic / “Review form”
        │
        ▼
 resolveVoiceIntent (heuristic → optional LLM)
        │
        ▼
 previewConcierge → scanForms + answer memory + submit candidate
        │
        ▼
 Sidepanel review (edit known / unknown)
        │
        ▼
 confirmConcierge → plan → Engine.run → upsertAnswers
        │
        ▼
 Optional user click → submitConciergeForm
        │
        ▼
 Optional TTS: “Filled N of M fields.”
```

Answer memory (`answer-memory`) is separate from the Options profile editor. New installs seed memory from the profile via `profileToAnswers`.

---

## Scripts

```bash
pnpm install              # deps
pnpm test                 # unit tests (Vitest)
pnpm test:e2e:install     # Playwright Chromium (once)
pnpm test:e2e             # build harness + e2e
pnpm build:extension      # production extension → apps/extension/dist
pnpm dev:extension        # CRXJS/Vite HMR
pnpm serve:fixtures       # fixtures on :4173
pnpm serve:stt            # Whisper STT on :8090
```

---

## Gaps & roadmap (honest inventory)

This is an open MVP with a clear core path and intentional scaffolds. Use this list if you want to contribute.

### Product gaps

| Gap | Notes |
|-----|-------|
| File uploads | Detected & skipped; `upload()` exists but not in concierge |
| Answer-memory editor UI | Answers learn from confirm; no dedicated CRUD screen |
| Wake word / streaming STT | Scaffold only |
| Cloud Gemini in Options | `GeminiProvider` exists in code; not yet a dropdown id |
| Concierge / voice e2e | Playwright covers smart fill; not full concierge + mic |

**Closed in MVP polish:** `scan_page` voice intent → concierge review; address fields in Options; CI runs unit tests + extension build.

### Package scaffolds (not production-ready)

| Package | State |
|---------|--------|
| `@browser-ai/security` | Encryption / secrets skeletons — profile is plaintext in local storage |
| `@browser-ai/ui` | Unused React primitive scaffolds |
| `@browser-ai/workflows` | Workflow skeletons |
| `@browser-ai/events` | Event bus skeleton (extension uses its own messages) |
| Memory embeddings / ranking / IndexedDB / SQLite | Stubbed |
| Navigator / Memory agents | Stubbed |

### Ideas to build on top

1. **Encrypted vault** for profile + API keys (`@browser-ai/security`).  
2. **Site policies** — allow/deny lists for auto-preview.  
3. **Multi-step wizards** — navigate pages with a NavigatorAgent.  
4. **Embedding retrieval** for long-form / FAQ answers.  
5. **Resume / cover-letter attach** via controlled file upload.  
6. **Playwright e2e for concierge + voice**.  
7. **Firefox / Edge packaging**.  
8. **ElevenLabs / Azure Speech TTS** via `TextToSpeechProvider`.  
9. **Streaming LLM + partial field highlights**.  
10. **Shared team answer packs** (export/import JSON, still local-first).  

---

## License

Released under the [MIT License](./LICENSE). Forever free to use, modify, fork, and ship — commercially or privately — with attribution.

Copyright © 2026 Abhijeeth and Browser AI Contributors.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, coding norms, how to add providers, and how to run tests.

Questions and PRs that harden the local-first path, improve mapping quality, or close gaps above are especially welcome.

---

## Credits

Built as a modular TypeScript monorepo: extension UX on top of reusable packages (`browser`, `engine`, `agents`, `ai`, `voice`, `memory`, `commands`, `contracts`). Heuristics keep the product useful when models are offline; providers make it sharper when you opt in.

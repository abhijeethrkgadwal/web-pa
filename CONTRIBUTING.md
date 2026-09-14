# Contributing to Browser AI

Thanks for helping make local-first form assistance better. This guide gets you productive quickly.

## Ground rules

1. **Local-first by default.** Features should work with heuristics + `chrome.storage` when no model is configured.
2. **Never auto-submit.** Submit controls may be detected and offered; the user always clicks.
3. **Confirm before write** for the concierge path.
4. **No secrets in git.** Do not commit API keys, `.env` files with credentials, or real profile dumps.
5. **Small, focused PRs** beat giant refactors.

## Setup

```bash
pnpm install
pnpm test
pnpm build:extension
```

Optional local AI stack:

```bash
pnpm serve:stt          # Whisper on :8090
ollama pull llama3.2    # optional LLM
pnpm serve:fixtures     # demo HTML on :4173
```

Load `apps/extension/dist` as an unpacked Chrome extension.

## Project map

| Path | Own this when… |
|------|----------------|
| `apps/extension` | UX, messaging, Options / Sidepanel |
| `packages/browser` | DOM scan / fill behavior |
| `packages/engine` | Orchestration (smart fill, concierge) |
| `packages/agents` | Concierge / Form / Planner agents |
| `packages/ai` | LLM providers + field mapping + intent |
| `packages/voice` | Mic, STT client, TTS |
| `packages/memory` | Profile, settings, answer memory |
| `packages/contracts` | Shared interfaces (keep stable) |
| `services/stt` | Local Whisper server |
| `tests/` | Unit + Playwright e2e |

## Adding a third-party AI / TTS / STT provider

1. Implement the contract in `packages/contracts` (`AIProvider`, `SpeechToTextProvider`, or `TextToSpeechProvider`).
2. Add the implementation under `packages/ai/src/providers` or `packages/voice/src/tts` (or transcription).
3. Extend `AiSettings` / provider id unions in `packages/memory/src/schema/AiSettings.ts`.
4. Update `createAIProviderFromSettings` or `createTtsProvider`.
5. Expose fields in `apps/extension/src/options/OptionsApp.tsx`.
6. Add a Vitest that mocks `fetch` (see `tests/unit/`).
7. Document the provider in the README “Provider integration” section.

## Coding style

- TypeScript throughout; prefer explicit contracts over `any`.
- Match existing naming and file layout; avoid drive-by refactors.
- Heuristic fallbacks should remain when AI calls fail.
- Keep extension message types in `apps/extension/src/shared/messages.ts` in sync with content script handlers.

## Tests

```bash
pnpm test                 # unit
pnpm test:e2e:install     # once
pnpm test:e2e             # Playwright
```

Add or update tests for any mapping, memory, provider, or engine behavior you change.

## License

By contributing, you agree that your contributions are licensed under the MIT License (see [LICENSE](./LICENSE)).

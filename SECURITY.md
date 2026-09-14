# Browser AI — Security notes

## Threat model (MVP)

| Asset | Storage | Risk |
|-------|---------|------|
| User profile | `chrome.storage.local` | Device-local; not encrypted |
| Answer memory | `chrome.storage.local` | Device-local; not encrypted |
| API keys (optional) | `chrome.storage.local` | Device-local; readable by this extension |
| Page DOM | Active tab only | Content script runs on permitted hosts |

There is **no** Browser AI cloud backend. Optional third-party providers receive only what you send when a feature is enabled (chat prompts for mapping/intent, audio for STT, text for TTS).

## Guarantees we try to keep

- Confirm-before-fill for the concierge path
- Never auto-click submit
- Skip password and file inputs in concierge
- Local Whisper STT binds to `127.0.0.1` by default

## Recommendations for contributors / forkers

1. Prefer Ollama + local Whisper when handling sensitive forms.
2. Implement `@browser-ai/security` encryption before syncing storage across devices.
3. Avoid logging profile values or API keys in telemetry.
4. Treat broad host permissions as a trust boundary — tighten matches if you ship a store build.

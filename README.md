# Browser AI

Local-first Chrome extension that understands web forms and fills them from your saved profile using natural language (text or voice).

## MVP status

Phases 0–7 are implemented:

| Phase | Capability |
|------|------------|
| 0 | Extension boots (popup ↔ content script) |
| 1 | Page scanner → semantic field model |
| 2 | Browser controller DOM actions |
| 3 | Commands + Engine orchestration |
| 4 | Local profile memory (Chrome storage) |
| 5 | Smart fill mapping (heuristics + optional Ollama) |
| 6 | Voice/text + confirm-before-fill |
| 7 | Retries, ask-missing-once, Playwright e2e, docs |

## Quick start

```bash
pnpm install
pnpm build:extension
```

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → `apps/extension/dist`
4. For local HTML fixtures, enable **Allow access to file URLs** on the extension  
   (or serve fixtures over http — preferred)

### Serve fixtures

```bash
pnpm serve:fixtures
```

Open:

- http://localhost:4173/job-application.html
- http://localhost:4173/contact-form.html

## Demo checklist

1. Reload the unpacked extension after every build
2. Popup → **Profile** → save First name, Email, Country (`in`), Summary, Willing to relocate
3. Open the job-application fixture
4. Popup → **Open assistant**
5. Type or say: `Fill my personal details` → **Preview fill**
   - Form stays empty
   - Proposed values are listed
   - If a required field is missing from memory, answer it once, then Continue
6. **Cancel** → page still empty
7. Preview again → **Confirm fill** → fields populate
8. Optional: Options → enable Ollama mapping (local Ollama required); Smart fill falls back to heuristics if Ollama fails

## Scripts

```bash
pnpm test                 # unit tests (Vitest)
pnpm test:e2e:install     # install Playwright Chromium (once)
pnpm test:e2e             # build harness + run Playwright e2e
pnpm build:extension      # production extension build
pnpm dev:extension        # CRXJS/Vite HMR
pnpm serve:fixtures       # static fixture server on :4173
```

## Architecture

```text
Voice / Text → Sidepanel → Engine
                          ├─ Memory (profile)
                          ├─ AI / heuristics (field mapping)
                          ├─ Commands
                          └─ Browser Controller → Webpage
```

Packages live under `packages/` (`browser`, `engine`, `memory`, `ai`, `agents`, `commands`, `voice`, …).  
The Chrome extension app is `apps/extension`.

## Notes

- No cloud backend is required for the MVP
- Submit is never auto-clicked
- Prefer http fixtures (`pnpm serve:fixtures`) over `file://` during development

import type { AIProvider } from '@browser-ai/contracts';
import {
  parseVoiceIntent,
  type ParsedVoiceIntent,
  type VoiceIntentKind,
} from '@browser-ai/voice';

const INTENT_SYSTEM = `You classify browser-assistant voice commands.
Reply with ONLY one JSON object: {"kind":"fill_personal_details"|"scan_page"|"unknown","confidence":0-1}
- fill_personal_details: user wants to autofill personal/form details from their profile
- scan_page: user wants to scan/detect form fields
- unknown: anything else`;

/**
 * Resolve intent with heuristics first, then optional Ollama/LLM for unknowns.
 */
export async function resolveVoiceIntent(
  transcript: string,
  options: {
    readonly useAi?: boolean;
    readonly provider?: AIProvider;
  } = {},
): Promise<ParsedVoiceIntent & { readonly source: 'heuristic' | 'ai' }> {
  const heuristic = parseVoiceIntent(transcript);
  if (heuristic.kind !== 'unknown' || !options.useAi || !options.provider) {
    return { ...heuristic, source: 'heuristic' };
  }

  try {
    const raw = await options.provider.generate([
      { role: 'system', content: INTENT_SYSTEM },
      { role: 'user', content: transcript },
    ]);

    const parsed = parseIntentJson(raw, transcript);
    if (parsed) {
      return { ...parsed, source: 'ai' };
    }
  } catch {
    // Fall through to heuristic unknown
  }

  return { ...heuristic, source: 'heuristic' };
}

function parseIntentJson(
  raw: string,
  transcript: string,
): ParsedVoiceIntent | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    const data = JSON.parse(match[0]) as {
      kind?: string;
      confidence?: number;
    };
    const kind = normalizeKind(data.kind);
    if (!kind) {
      return null;
    }
    return {
      kind,
      transcript: transcript.trim(),
      confidence:
        typeof data.confidence === 'number'
          ? Math.max(0, Math.min(1, data.confidence))
          : 0.7,
    };
  } catch {
    return null;
  }
}

function normalizeKind(value: unknown): VoiceIntentKind | null {
  if (value === 'fill_personal_details' || value === 'scan_page' || value === 'unknown') {
    return value;
  }
  return null;
}

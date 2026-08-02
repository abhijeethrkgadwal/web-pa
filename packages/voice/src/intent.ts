export type VoiceIntentKind = 'fill_personal_details' | 'scan_page' | 'unknown';

export interface ParsedVoiceIntent {
  readonly kind: VoiceIntentKind;
  readonly transcript: string;
  readonly confidence: number;
}

const FILL_PATTERNS = [
  /fill\s+(my\s+)?(personal\s+)?details/i,
  /fill\s+(this\s+)?(form|application)/i,
  /autofill/i,
  /auto[\s-]?fill/i,
  /complete\s+(the\s+)?form/i,
  /smart\s+fill/i,
];

const SCAN_PATTERNS = [/scan\s+(the\s+)?(page|form)/i, /detect\s+fields/i];

/**
 * Parse a voice/text transcript into a high-level intent.
 */
export function parseVoiceIntent(transcript: string): ParsedVoiceIntent {
  const normalized = transcript.trim();

  if (!normalized) {
    return { kind: 'unknown', transcript: normalized, confidence: 0 };
  }

  for (const pattern of FILL_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        kind: 'fill_personal_details',
        transcript: normalized,
        confidence: 0.9,
      };
    }
  }

  for (const pattern of SCAN_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        kind: 'scan_page',
        transcript: normalized,
        confidence: 0.85,
      };
    }
  }

  return {
    kind: 'unknown',
    transcript: normalized,
    confidence: 0.2,
  };
}

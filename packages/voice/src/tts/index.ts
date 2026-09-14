import type {
  TextToSpeechOptions,
  TextToSpeechProvider,
  TextToSpeechResult,
} from '@browser-ai/contracts';

/**
 * Browser built-in TTS via `window.speechSynthesis`.
 * Offline, free, no API key — quality varies by OS/voice pack.
 */
export class BrowserSpeechSynthesisProvider implements TextToSpeechProvider {
  readonly name = 'browser';
  private utterance: SpeechSynthesisUtterance | null = null;

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async speak(
    text: string,
    options?: Partial<TextToSpeechOptions>,
  ): Promise<void> {
    if (!BrowserSpeechSynthesisProvider.isSupported()) {
      throw new Error('Browser speechSynthesis is not available');
    }

    this.stop();
    const utterance = new SpeechSynthesisUtterance(text);
    if (options?.language) {
      utterance.lang = options.language;
    }
    if (options?.voice) {
      const match = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.name === options.voice || voice.lang === options.voice);
      if (match) {
        utterance.voice = match;
      }
    }
    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.utterance = null;
  }
}

/**
 * OpenAI-compatible `/v1/audio/speech` TTS
 * (OpenAI, Groq-compatible gateways, self-hosted proxies).
 */
export class OpenAICompatibleTtsProvider implements TextToSpeechProvider {
  readonly name = 'openai-tts';

  async speak(
    text: string,
    options: Partial<TextToSpeechOptions> = {},
  ): Promise<TextToSpeechResult> {
    const baseUrl = (options.baseUrl ?? 'https://api.openai.com').replace(/\/$/, '');
    const model = options.model ?? 'gpt-4o-mini-tts';
    const voice = options.voice ?? 'alloy';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.apiKey?.trim()) {
      headers.Authorization = `Bearer ${options.apiKey.trim()}`;
    }

    const response = await fetch(`${baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        voice,
        input: text,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`TTS request failed (${response.status}): ${detail}`);
    }

    const audio = await response.blob();
    return {
      audio,
      contentType: audio.type || 'audio/mpeg',
    };
  }
}

export function createTtsProvider(
  id: 'none' | 'browser' | 'openai' | undefined,
): TextToSpeechProvider | undefined {
  if (!id || id === 'none') {
    return undefined;
  }
  if (id === 'browser') {
    return new BrowserSpeechSynthesisProvider();
  }
  if (id === 'openai') {
    return new OpenAICompatibleTtsProvider();
  }
  return undefined;
}

/**
 * Speak text using the configured provider. Plays OpenAI audio via HTMLAudioElement.
 */
export async function speakText(
  text: string,
  options: {
    readonly provider?: 'none' | 'browser' | 'openai';
    readonly baseUrl?: string;
    readonly model?: string;
    readonly voice?: string;
    readonly apiKey?: string;
    readonly language?: string;
  },
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || !options.provider || options.provider === 'none') {
    return;
  }

  const provider = createTtsProvider(options.provider);
  if (!provider) {
    return;
  }

  const result = await provider.speak(trimmed, {
    baseUrl: options.baseUrl,
    model: options.model,
    voice: options.voice,
    apiKey: options.apiKey,
    language: options.language,
  });

  if (result?.audio && typeof Audio !== 'undefined') {
    const url = URL.createObjectURL(result.audio);
    try {
      const audio = new Audio(url);
      await audio.play();
    } finally {
      // Revoke after a delay so playback can start.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  }
}

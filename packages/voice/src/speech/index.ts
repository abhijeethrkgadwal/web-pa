import type { SpeechRecognitionContract, VoiceCommand, VoiceInputConfig } from '@browser-ai/contracts';

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
}

interface BrowserSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<{
    readonly isFinal: boolean;
    readonly 0?: { transcript: string; confidence: number };
  }>;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const scope = globalThis as typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

/**
 * Web Speech API recognition wrapper (optional fallback; often flaky in extensions).
 */
export class WebSpeechRecognition implements SpeechRecognitionContract {
  private recognition: BrowserSpeechRecognition | null = null;
  private readonly handlers = new Set<(command: VoiceCommand) => void>();
  private errorHandler: ((message: string) => void) | null = null;

  onError(handler: (message: string) => void): void {
    this.errorHandler = handler;
  }

  async start(config: VoiceInputConfig = { sampleRate: 16000 }): Promise<void> {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      throw new Error('Web Speech API is not supported in this browser');
    }

    await this.stop();

    const recognition = new Ctor();
    recognition.lang = config.language ?? 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const alternative = result?.[0];
      if (!alternative) {
        return;
      }

      const command: VoiceCommand = {
        transcript: alternative.transcript.trim(),
        confidence: alternative.confidence,
        isFinal: result.isFinal,
      };

      for (const handler of this.handlers) {
        handler(command);
      }
    };

    recognition.onerror = (event) => {
      this.errorHandler?.(event.error ?? 'speech-recognition-error');
    };

    this.recognition = recognition;
    recognition.start();
  }

  async stop(): Promise<void> {
    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.stop();
    } catch {
      // already stopped
    }
    this.recognition = null;
  }

  onResult(handler: (command: VoiceCommand) => void): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

export { LocalMicRecognition } from './localMic';
export type { LocalMicRecognitionOptions } from './localMic';

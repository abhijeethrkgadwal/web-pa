import type {
  SpeechRecognitionContract,
  SpeechToTextOptions,
  VoiceCommand,
  VoiceInputConfig,
} from '@browser-ai/contracts';

import { isMicrophoneSupported, MediaRecorderSession } from '../recorder/mediaRecorder';
import { transcribeWithOpenAiCompatible } from '../transcription/openaiCompatible';

export interface LocalMicRecognitionOptions extends SpeechToTextOptions {
  /** Auto-stop recording after this many ms (default 5000). */
  readonly maxDurationMs?: number;
}

/**
 * Record mic audio → local Whisper STT → emit final transcript.
 * Replaces flaky Web Speech API for the extension sidepanel.
 */
export class LocalMicRecognition implements SpeechRecognitionContract {
  private readonly session = new MediaRecorderSession();
  private readonly handlers = new Set<(command: VoiceCommand) => void>();
  private errorHandler: ((message: string) => void) | null = null;
  private options: LocalMicRecognitionOptions;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private finishing = false;

  constructor(options: LocalMicRecognitionOptions) {
    this.options = options;
  }

  static isSupported(): boolean {
    return isMicrophoneSupported();
  }

  configure(options: Partial<LocalMicRecognitionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  onError(handler: (message: string) => void): void {
    this.errorHandler = handler;
  }

  async start(config: VoiceInputConfig = { sampleRate: 16_000 }): Promise<void> {
    if (!LocalMicRecognition.isSupported()) {
      throw new Error('Microphone access is not available in this context');
    }

    this.finishing = false;
    await this.session.start();

    const maxDurationMs = this.options.maxDurationMs ?? 5_000;
    this.clearTimer();
    this.stopTimer = setTimeout(() => {
      void this.finish(config.language ?? this.options.language).catch(() => {
        // onError already notified the UI
      });
    }, maxDurationMs);
  }

  async stop(): Promise<void> {
    this.clearTimer();
    if (this.session.recording && !this.finishing) {
      await this.finish(this.options.language);
      return;
    }

    await this.session.stop();
  }

  onResult(handler: (command: VoiceCommand) => void): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private async finish(language?: string): Promise<void> {
    if (this.finishing) {
      return;
    }
    this.finishing = true;
    this.clearTimer();

    try {
      const blob = await this.session.stop();
      if (!blob) {
        throw new Error('No audio captured — try again and speak clearly');
      }
      if (blob.size < 500) {
        throw new Error('Recording too short — hold Mic for 2–3 seconds and speak clearly');
      }

      const result = await transcribeWithOpenAiCompatible(blob, {
        baseUrl: this.options.baseUrl,
        model: this.options.model,
        language: language ?? this.options.language,
      });

      const command: VoiceCommand = {
        transcript: result.text,
        confidence: result.confidence,
        isFinal: true,
      };

      for (const handler of this.handlers) {
        handler(command);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Speech transcription failed';
      this.errorHandler?.(message);
      throw error;
    } finally {
      this.finishing = false;
    }
  }

  private clearTimer(): void {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }
}

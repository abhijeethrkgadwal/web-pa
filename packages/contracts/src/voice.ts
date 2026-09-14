export interface VoiceInputConfig {
  readonly sampleRate: number;
  readonly language?: string;
}

export interface VoiceCommand {
  readonly transcript: string;
  readonly confidence?: number;
  readonly isFinal?: boolean;
}

export interface SpeechRecognitionContract {
  start(config?: VoiceInputConfig): Promise<void>;
  stop(): Promise<void>;
  onResult(handler: (command: VoiceCommand) => void): () => void;
}

export interface TranscriptionResult {
  readonly text: string;
  readonly confidence?: number;
}

export interface SpeechToTextOptions {
  readonly baseUrl: string;
  readonly model?: string;
  readonly language?: string;
  /** Optional bearer token for cloud OpenAI-compatible STT. */
  readonly apiKey?: string;
}

export interface SpeechToTextProvider {
  transcribe(audio: Blob, options?: Partial<SpeechToTextOptions>): Promise<TranscriptionResult>;
}

export interface TextToSpeechOptions {
  /** OpenAI-compatible TTS base URL (no trailing `/v1`). */
  readonly baseUrl?: string;
  readonly model?: string;
  readonly voice?: string;
  readonly apiKey?: string;
  readonly language?: string;
}

export interface TextToSpeechResult {
  readonly audio: Blob;
  readonly contentType: string;
}

/**
 * Pluggable text-to-speech. Implement this to wire ElevenLabs, OpenAI TTS,
 * Azure Speech, Piper, browser `speechSynthesis`, etc.
 */
export interface TextToSpeechProvider {
  readonly name: string;
  speak(text: string, options?: Partial<TextToSpeechOptions>): Promise<TextToSpeechResult | void>;
  stop?(): void;
}

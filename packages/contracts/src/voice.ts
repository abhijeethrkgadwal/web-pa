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

/**
 * Voice interfaces, speech recognition, and intent parsing.
 */
export interface VoiceSession {
  readonly id: string;
}

export class VoiceSkeleton implements VoiceSession {
  readonly id = 'voice-placeholder';
}

export * from './interfaces';
export * from './recorder';
export * from './speech';
export * from './streaming';
export * from './transcription';
export * from './wakeword';
export * from './intent';

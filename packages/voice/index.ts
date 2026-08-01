/**
 * TODO: Aggregate speech, wakeword, streaming, recorder, and transcription abstractions.
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

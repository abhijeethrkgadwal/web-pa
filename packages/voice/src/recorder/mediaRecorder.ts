export interface MediaRecorderSessionOptions {
  readonly mimeType?: string;
}

export function isMicrophoneSupported(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

/**
 * Push-to-talk style recorder using MediaRecorder.
 * Collects one complete blob on stop (no timeslices — more reliable for decode).
 */
export class MediaRecorderSession {
  private mediaStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;

  get recording(): boolean {
    return this.recorder?.state === 'recording';
  }

  get elapsedMs(): number {
    return this.startedAt ? Date.now() - this.startedAt : 0;
  }

  async start(options: MediaRecorderSessionOptions = {}): Promise<void> {
    if (!isMicrophoneSupported()) {
      throw new Error('Microphone access is not available in this context');
    }

    await this.stop();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch (error) {
      throw normalizeMicError(error);
    }

    const mimeType = pickMimeType(options.mimeType);
    const recorder = mimeType
      ? new MediaRecorder(this.mediaStream, { mimeType })
      : new MediaRecorder(this.mediaStream);

    this.chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.recorder = recorder;
    this.startedAt = Date.now();
    // No timeslice: a single complete container is easier for decodeAudioData.
    recorder.start();
  }

  async stop(): Promise<Blob | null> {
    const recorder = this.recorder;
    const stream = this.mediaStream;
    this.recorder = null;
    this.mediaStream = null;
    this.startedAt = 0;

    if (!recorder) {
      stopTracks(stream);
      return null;
    }

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        resolve(new Blob(this.chunks, { type }));
      };

      try {
        if (recorder.state === 'recording') {
          // Flush any pending data before stopping.
          try {
            recorder.requestData();
          } catch {
            // optional
          }
          recorder.stop();
        } else {
          resolve(new Blob(this.chunks, { type: recorder.mimeType || 'audio/webm' }));
        }
      } catch {
        resolve(new Blob(this.chunks, { type: recorder.mimeType || 'audio/webm' }));
      }
    });

    stopTracks(stream);
    this.chunks = [];
    return blob.size > 0 ? blob : null;
  }
}

function pickMimeType(preferred?: string): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  const candidates = [
    preferred,
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ].filter((value): value is string => Boolean(value));

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function stopTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function normalizeMicError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Could not access the microphone');
  }

  const name = 'name' in error ? String((error as DOMException).name) : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return new Error('Permission dismissed');
  }
  if (name === 'NotFoundError') {
    return new Error('No microphone was found on this device');
  }
  return error;
}

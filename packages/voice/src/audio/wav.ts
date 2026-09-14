/**
 * Decode an arbitrary audio Blob (e.g. MediaRecorder webm) into 16 kHz mono WAV.
 */
export async function blobToWav(
  blob: Blob,
  sampleRate = 16_000,
): Promise<Blob> {
  const AudioContextCtor =
    globalThis.AudioContext ??
    (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error('Web Audio API is not available');
  }

  const context = new AudioContextCtor();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    if (arrayBuffer.byteLength < 100) {
      throw new Error('Recording too short — hold Mic for 2–3 seconds and speak clearly');
    }

    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const mono = mixToMono(decoded);
    const resampled = resampleLinear(mono, decoded.sampleRate, sampleRate);

    // Soft peak-normalize so quiet mics still reach Whisper.
    normalizePeak(resampled, 0.9);

    const rms = rootMeanSquare(resampled);
    if (rms < 0.001) {
      throw new Error('No speech detected (silent audio). Check the mic and try again.');
    }

    return encodeWav(resampled, sampleRate);
  } catch (error) {
    if (error instanceof Error && /too short|silent|No speech/i.test(error.message)) {
      throw error;
    }
    throw new Error(
      `Could not decode microphone audio: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    );
  } finally {
    await context.close().catch(() => undefined);
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const mono = new Float32Array(length);

  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      mono[i] += data[i] / channels;
    }
  }

  return mono;
}

function resampleLinear(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) {
    return input;
  }

  const ratio = fromRate / toRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const position = i * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const frac = position - left;
    output[i] = input[left] * (1 - frac) + input[right] * frac;
  }

  return output;
}

function normalizePeak(samples: Float32Array, targetPeak: number): void {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i] ?? 0));
  }
  if (peak < 1e-6 || peak >= targetPeak) {
    return;
  }
  const gain = targetPeak / peak;
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = (samples[i] ?? 0) * gain;
  }
}

function rootMeanSquare(samples: Float32Array): number {
  if (samples.length === 0) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = samples[i] ?? 0;
    sum += value * value;
  }
  return Math.sqrt(sum / samples.length);
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

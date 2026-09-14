import type { SpeechToTextOptions, TranscriptionResult } from '@browser-ai/contracts';

import { blobToWav } from '../audio/wav';

const DEFAULT_MODEL = 'Xenova/whisper-tiny.en';

/**
 * Transcribe audio via local Whisper STT.
 * Prefer JSON base64 (reliable) over multipart.
 */
export async function transcribeWithOpenAiCompatible(
  audio: Blob,
  options: SpeechToTextOptions,
): Promise<TranscriptionResult> {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const model = options.model ?? DEFAULT_MODEL;
  const wav = audio.type.includes('wav') ? audio : await blobToWav(audio);

  if (wav.size < 1000) {
    throw new Error('Recording too short — hold Mic for 2–3 seconds and speak clearly');
  }

  const audioBase64 = await blobToBase64(wav);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.apiKey?.trim()) {
    headers.Authorization = `Bearer ${options.apiKey.trim()}`;
  }

  const response = await fetch(`${baseUrl}/v1/audio/transcriptions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      audio_base64: audioBase64,
      language: options.language ?? 'en',
      response_format: 'json',
    }),
  });

  const raw = await response.text();
  let data: { text?: string; error?: string } = {};
  try {
    data = raw ? (JSON.parse(raw) as { text?: string; error?: string }) : {};
  } catch {
    data = { error: raw || response.statusText };
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        `Whisper STT failed (${response.status}). Is pnpm serve:stt running?`,
    );
  }

  if (data.error) {
    throw new Error(data.error);
  }

  const text = data.text?.trim() ?? '';
  if (!text) {
    throw new Error(
      'Whisper heard no words. Speak for 2–3 seconds, then click Stop.',
    );
  }

  return { text };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await readBlobAsArrayBuffer(blob);
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }

  if (typeof Response !== 'undefined') {
    return new Response(blob).arrayBuffer();
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsArrayBuffer(blob);
  });
}

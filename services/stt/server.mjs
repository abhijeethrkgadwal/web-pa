import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT ?? 8090);
const modelId = process.env.WHISPER_MODEL ?? 'Xenova/whisper-tiny.en';
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(rootDir, '.cache');

/** @type {Promise<any> | null} */
let transcriberPromise = null;

async function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      env.cacheDir = cacheDir;
      env.allowLocalModels = true;
      console.log(`Loading Whisper model: ${modelId} (first run downloads weights)…`);
      return pipeline('automatic-speech-recognition', modelId);
    })();
  }
  return transcriberPromise;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function getBoundary(contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!match) {
    return null;
  }
  return (match[1] || match[2] || '').trim();
}

/**
 * Buffer-safe multipart extractor (avoids binary corruption from string splits).
 */
function extractMultipartFile(buffer, contentType) {
  const boundary = getBoundary(contentType);
  if (!boundary) {
    throw new Error('multipart boundary missing');
  }

  const delimiter = Buffer.from(`--${boundary}`);
  const headerSep = Buffer.from('\r\n\r\n');
  let start = buffer.indexOf(delimiter);
  if (start < 0) {
    throw new Error('multipart delimiter not found');
  }

  while (start >= 0 && start < buffer.length) {
    let partStart = start + delimiter.length;
    if (buffer.subarray(partStart, partStart + 2).equals(Buffer.from('--'))) {
      break;
    }
    if (buffer.subarray(partStart, partStart + 2).equals(Buffer.from('\r\n'))) {
      partStart += 2;
    }

    const next = buffer.indexOf(delimiter, partStart);
    const partEnd = next >= 0 ? next : buffer.length;
    let part = buffer.subarray(partStart, partEnd);
    if (part.length >= 2 && part.subarray(part.length - 2).equals(Buffer.from('\r\n'))) {
      part = part.subarray(0, part.length - 2);
    }

    const sep = part.indexOf(headerSep);
    if (sep >= 0) {
      const header = part.subarray(0, sep).toString('utf8');
      if (/name="file"/i.test(header)) {
        const data = Buffer.from(part.subarray(sep + headerSep.length));
        const filenameMatch = /filename="([^"]+)"/i.exec(header);
        return {
          filename: filenameMatch?.[1] ?? 'speech.wav',
          data,
        };
      }
    }

    start = next;
  }

  throw new Error('file field not found in multipart body');
}

function parseWavPcm(buffer) {
  if (buffer.length < 44) {
    throw new Error(`WAV too small (${buffer.length} bytes)`);
  }
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(
      `Only WAV audio is supported (got ${buffer.toString('ascii', 0, 4)}/${buffer.toString('ascii', 8, 12)})`,
    );
  }

  let offset = 12;
  let sampleRate = 16_000;
  let bitsPerSample = 16;
  let channels = 1;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkData = offset + 8;

    if (chunkId === 'fmt ') {
      channels = buffer.readUInt16LE(chunkData + 2);
      sampleRate = buffer.readUInt32LE(chunkData + 4);
      bitsPerSample = buffer.readUInt16LE(chunkData + 14);
    } else if (chunkId === 'data') {
      dataOffset = chunkData;
      dataSize = chunkSize;
      break;
    }

    offset = chunkData + chunkSize + (chunkSize % 2);
  }

  if (dataOffset < 0) {
    throw new Error('WAV data chunk missing');
  }

  const bytesPerSample = bitsPerSample / 8;
  const frameSize = bytesPerSample * channels;
  const sampleCount = Math.floor(dataSize / frameSize);
  const samples = new Float32Array(sampleCount);

  if (bitsPerSample === 16) {
    for (let i = 0; i < sampleCount; i += 1) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch += 1) {
        const index = dataOffset + (i * channels + ch) * 2;
        sum += buffer.readInt16LE(index) / 32768;
      }
      samples[i] = sum / channels;
    }
  } else if (bitsPerSample === 32) {
    for (let i = 0; i < sampleCount; i += 1) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch += 1) {
        const index = dataOffset + (i * channels + ch) * 4;
        sum += buffer.readFloatLE(index);
      }
      samples[i] = sum / channels;
    }
  } else {
    throw new Error(`Unsupported WAV bit depth: ${bitsPerSample}`);
  }

  return { samples, sampleRate };
}

function audioStats(samples) {
  if (samples.length === 0) {
    return { durationSec: 0, rms: 0, peak: 0 };
  }
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.abs(samples[i] ?? 0);
    sumSq += value * value;
    if (value > peak) {
      peak = value;
    }
  }
  return {
    durationSec: samples.length / 16_000,
    rms: Math.sqrt(sumSq / samples.length),
    peak,
  };
}

async function transcribeWavBuffer(wavBuffer) {
  const { samples, sampleRate } = parseWavPcm(wavBuffer);
  const stats = audioStats(samples);
  // Normalize duration against actual sample rate.
  stats.durationSec = samples.length / sampleRate;

  console.log(
    `[stt] wav bytes=${wavBuffer.length} rate=${sampleRate} samples=${samples.length} duration=${stats.durationSec.toFixed(2)}s rms=${stats.rms.toFixed(4)} peak=${stats.peak.toFixed(4)}`,
  );

  if (stats.durationSec < 0.4) {
    throw new Error('Recording too short — hold Mic for at least 1–2 seconds and speak clearly');
  }
  if (stats.rms < 0.001) {
    throw new Error('No speech detected (silent audio). Check the mic and try again.');
  }

  const transcriber = await getTranscriber();

  // Prefer RawAudio object; fall back to Float32Array for older transformers.js.
  let result;
  try {
    result = await transcriber(
      {
        data: samples,
        sampling_rate: sampleRate,
      },
      {
        language: 'english',
        task: 'transcribe',
        chunk_length_s: 30,
        return_timestamps: false,
      },
    );
  } catch {
    result = await transcriber(samples, {
      sampling_rate: sampleRate,
      language: 'english',
      task: 'transcribe',
    });
  }

  const text = String(result?.text ?? '').trim();
  console.log(`[stt] transcript="${text}"`);
  return text;
}

function sendJson(res, status, body) {
  const payload = status === 204 ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    sendJson(res, 200, { ok: true, model: modelId });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/v1/audio/transcriptions') {
    try {
      const contentType = req.headers['content-type'] ?? '';
      const body = await readRequestBody(req);
      let wavBuffer;

      if (contentType.includes('application/json')) {
        const payload = JSON.parse(body.toString('utf8'));
        if (!payload?.audio_base64) {
          throw new Error('audio_base64 missing');
        }
        wavBuffer = Buffer.from(String(payload.audio_base64), 'base64');
      } else {
        const file = extractMultipartFile(body, contentType);
        wavBuffer = file.data;
      }

      const text = await transcribeWavBuffer(wavBuffer);
      if (!text) {
        sendJson(res, 422, {
          error:
            'Whisper heard no words. Speak closer to the mic for 2–3 seconds, then click Stop.',
        });
        return;
      }
      sendJson(res, 200, { text });
    } catch (error) {
      console.error('[stt] failed:', error);
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'transcription failed',
      });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local Whisper STT ready: http://127.0.0.1:${port}/v1/audio/transcriptions`);
  console.log(`Model: ${modelId}`);
  void getTranscriber()
    .then(() => console.log('Whisper model loaded.'))
    .catch((error) => {
      console.error('Failed to load Whisper model:', error);
    });
});

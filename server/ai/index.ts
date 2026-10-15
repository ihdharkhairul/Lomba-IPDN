import path from 'node:path';
import { GeminiProvider } from './geminiProvider';
import { HybridProvider } from './hybridProvider';
import { MockProvider } from './mockProvider';
import { YoloProvider, type YoloOptions } from './yoloProvider';
import type { AiProvider } from './types';

/**
 *  REAL_AI -> Google Gemini          MOCK_AI -> simulasi (tanpa melihat foto)
 *  YOLO    -> model YOLO lokal       HYBRID  -> YOLO lalu Gemini (keduanya harus setuju)
 */
export type AiMode = 'REAL_AI' | 'MOCK_AI' | 'YOLO' | 'HYBRID';

export function resolveAiMode(env: NodeJS.ProcessEnv = process.env): AiMode {
  const raw = (env.AI_MODE ?? 'REAL_AI').trim().toUpperCase();
  return raw === 'MOCK_AI' || raw === 'YOLO' || raw === 'HYBRID' ? raw : 'REAL_AI';
}

export function yoloOptionsFromEnv(env: NodeJS.ProcessEnv = process.env): YoloOptions {
  const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    modelPath: path.resolve(env.YOLO_MODEL_PATH?.trim() || 'models/yolo/best.onnx'),
    classesPath: path.resolve(env.YOLO_CLASSES_PATH?.trim() || 'models/yolo/classes.json'),
    inputSize: num(env.YOLO_INPUT_SIZE, 640),
    resize: env.YOLO_RESIZE?.trim().toLowerCase() === 'stretch' ? 'stretch' : 'letterbox',
    confThreshold: num(env.YOLO_CONF, 0.25),
    iouThreshold: num(env.YOLO_IOU, 0.45),
  };
}

/** Memilih provider berdasarkan environment variable AI_MODE. */
export function createProviderFromEnv(env: NodeJS.ProcessEnv = process.env): AiProvider {
  const gemini = () =>
    new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash', {
      fallbackModel: env.GEMINI_FALLBACK_MODEL?.trim() || undefined,
    });
  switch (resolveAiMode(env)) {
    case 'MOCK_AI':
      return new MockProvider();
    case 'YOLO':
      return new YoloProvider(yoloOptionsFromEnv(env));
    case 'HYBRID':
      return new HybridProvider(new YoloProvider(yoloOptionsFromEnv(env)), gemini());
    default:
      return gemini();
  }
}

export type { AiProvider } from './types';

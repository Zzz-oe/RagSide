import { env } from '../config/env.js';
import type { AiProvider, AiSettingsRecord } from '../types.js';
import { getAiSettingsRecord } from './ai-settings.service.js';

export interface ResolvedAiSettings {
  provider: AiProvider;
  baseUrl: string;
  apiKey: string | null;
  chatModel: string;
  embeddingModel: string;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

function buildFallbackSettings(): ResolvedAiSettings {
  return {
    provider: 'ollama',
    baseUrl: env.OLLAMA_BASE_URL,
    apiKey: null,
    chatModel: env.OLLAMA_CHAT_MODEL,
    embeddingModel: env.OLLAMA_EMBEDDING_MODEL
  };
}

export async function resolveAiSettings(): Promise<ResolvedAiSettings> {
  try {
    const record: AiSettingsRecord = await getAiSettingsRecord();
    return {
      provider: record.provider,
      baseUrl: normalizeBaseUrl(record.baseUrl),
      apiKey: record.apiKey,
      chatModel: record.chatModel,
      embeddingModel: record.embeddingModel
    };
  } catch {
    return buildFallbackSettings();
  }
}


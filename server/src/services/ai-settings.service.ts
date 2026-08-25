import { pool } from '../db/pool.js';
import type { AiSettings, AiSettingsInput, AiSettingsRecord } from '../types.js';

type AiSettingsRow = Record<string, unknown>;

function mapAiSettings(row: AiSettingsRow): AiSettingsRecord {
  return {
    provider: row.provider as AiSettingsRecord['provider'],
    baseUrl: String(row.base_url),
    chatModel: String(row.chat_model),
    embeddingModel: String(row.embedding_model),
    hasApiKey: Boolean(row.api_key),
    apiKey: row.api_key ? String(row.api_key) : null,
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

export async function getAiSettingsRecord(): Promise<AiSettingsRecord> {
  const { rows } = await pool.query(
    `SELECT provider, base_url, api_key, chat_model, embedding_model, updated_at
     FROM ai_settings
     WHERE id = 1`
  );

  if (!rows[0]) {
    const { rows: inserted } = await pool.query(
      `INSERT INTO ai_settings (id, provider, base_url, chat_model, embedding_model)
       VALUES (1, 'ollama', 'http://localhost:11434', 'qwen3:4b', 'nomic-embed-text')
       RETURNING provider, base_url, api_key, chat_model, embedding_model, updated_at`
    );
    return mapAiSettings(inserted[0]);
  }

  return mapAiSettings(rows[0]);
}

export async function getAiSettings(): Promise<AiSettings> {
  const record = await getAiSettingsRecord();
  const { apiKey: _apiKey, ...settings } = record;
  return settings;
}

export async function updateAiSettings(input: AiSettingsInput): Promise<AiSettings> {
  const { rows } = await pool.query(
    `UPDATE ai_settings
     SET provider = $1,
         base_url = $2,
         api_key = CASE
           WHEN $5::boolean THEN NULL
           WHEN $4::text IS NOT NULL AND $4::text <> '' THEN $4::text
           ELSE api_key
         END,
         chat_model = $3,
         embedding_model = $6,
         updated_at = now()
     WHERE id = 1
     RETURNING provider, base_url, api_key, chat_model, embedding_model, updated_at`,
    [
      input.provider,
      input.baseUrl,
      input.chatModel,
      input.apiKey ?? null,
      Boolean(input.clearApiKey),
      input.embeddingModel
    ]
  );

  const record = mapAiSettings(rows[0]);
  const { apiKey: _apiKey, ...settings } = record;
  return settings;
}

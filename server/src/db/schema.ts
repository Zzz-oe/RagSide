import { pool } from './pool.js';

export const DEFAULT_KNOWLEDGE_BASE_ID = '00000000-0000-4000-8000-000000000001';

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS ai_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      provider TEXT NOT NULL DEFAULT 'ollama' CHECK (provider IN ('ollama', 'openai_compatible')),
      base_url TEXT NOT NULL DEFAULT 'http://localhost:11434',
      api_key TEXT,
      chat_model TEXT NOT NULL DEFAULT 'qwen3:4b',
      embedding_model TEXT NOT NULL DEFAULT 'nomic-embed-text',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
      page_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      page_number INTEGER NOT NULL DEFAULT 1,
      chunk_index INTEGER NOT NULL,
      char_start INTEGER NOT NULL DEFAULT 0,
      char_end INTEGER NOT NULL DEFAULT 0,
      embedding_provider TEXT NOT NULL DEFAULT 'ollama',
      embedding_model TEXT NOT NULL DEFAULT 'nomic-embed-text',
      embedding vector NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(document_id, chunk_index)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
      title TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      sources JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS documents_kb_status_idx ON documents(knowledge_base_id, status);
    CREATE INDEX IF NOT EXISTS chunks_document_idx ON document_chunks(document_id);
    CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages(conversation_id, created_at);

    ALTER TABLE document_chunks
      ADD COLUMN IF NOT EXISTS embedding_provider TEXT NOT NULL DEFAULT 'ollama';

    ALTER TABLE document_chunks
      ADD COLUMN IF NOT EXISTS embedding_model TEXT NOT NULL DEFAULT 'nomic-embed-text';
  `);

  await pool.query(
    `INSERT INTO ai_settings (id, provider, base_url, chat_model, embedding_model)
     VALUES (1, 'ollama', $1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    [
      'http://localhost:11434',
      'qwen3:4b',
      'nomic-embed-text'
    ]
  );

  await pool.query(
    `INSERT INTO knowledge_bases (id, name)
     VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [DEFAULT_KNOWLEDGE_BASE_ID, '默认知识库']
  );
}

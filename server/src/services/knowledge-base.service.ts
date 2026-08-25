import { pool } from '../db/pool.js';
import { DEFAULT_KNOWLEDGE_BASE_ID } from '../db/schema.js';
import type { KnowledgeBase } from '../types.js';

function mapKnowledgeBase(row: Record<string, unknown>): KnowledgeBase {
  return {
    id: String(row.id),
    name: String(row.name),
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const { rows } = await pool.query('SELECT * FROM knowledge_bases ORDER BY created_at ASC');
  return rows.map(mapKnowledgeBase);
}

export async function createKnowledgeBase(name: string): Promise<KnowledgeBase> {
  const { rows } = await pool.query('INSERT INTO knowledge_bases (name) VALUES ($1) RETURNING *', [name]);
  return mapKnowledgeBase(rows[0]);
}

export async function ensureKnowledgeBase(id = DEFAULT_KNOWLEDGE_BASE_ID): Promise<void> {
  const { rowCount } = await pool.query('SELECT 1 FROM knowledge_bases WHERE id = $1', [id]);
  if (!rowCount) {
    throw new Error(`Knowledge base not found: ${id}`);
  }
}


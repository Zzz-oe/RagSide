import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { toVectorLiteral } from '../db/vector.js';
import type { SourceReference } from '../types.js';
import type { ResolvedAiSettings } from './ai-provider.service.js';
import { embedText } from './embedding.service.js';

export async function retrieveSources(
  question: string,
  knowledgeBaseId: string,
  settings?: ResolvedAiSettings
): Promise<SourceReference[]> {
  const questionEmbedding = await embedText(question, settings);
  const vector = toVectorLiteral(questionEmbedding);

  const { rows } = await pool.query(
    `WITH ranked_chunks AS (
      SELECT
        dc.document_id,
        d.original_name AS filename,
        dc.page_number,
        dc.content,
        1 - (dc.embedding <=> $1::vector) AS score
      FROM document_chunks dc
      INNER JOIN documents d ON d.id = dc.document_id
      WHERE d.knowledge_base_id = $2
        AND d.status = 'ready'
        AND dc.embedding_provider = $4
        AND dc.embedding_model = $5
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $3
    )
    SELECT * FROM ranked_chunks WHERE score >= $6 ORDER BY score DESC`,
    [
      vector,
      knowledgeBaseId,
      env.RETRIEVAL_TOP_K,
      settings?.provider ?? 'ollama',
      settings?.embeddingModel ?? 'nomic-embed-text',
      env.RETRIEVAL_MIN_SCORE
    ]
  );

  return rows.map((row) => ({
    documentId: row.document_id,
    filename: row.filename,
    page: row.page_number,
    content: row.content,
    score: Number(row.score)
  }));
}

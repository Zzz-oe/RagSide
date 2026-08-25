import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '../config/logger.js';
import { pool, withTransaction } from '../db/pool.js';
import { toVectorLiteral } from '../db/vector.js';
import type { DocumentRecord } from '../types.js';
import { resolveAiSettings } from './ai-provider.service.js';
import { chunkPages } from './chunk.service.js';
import { embedTexts } from './embedding.service.js';
import { parseDocument } from './parser.service.js';

function mapDocument(row: Record<string, unknown>): DocumentRecord {
  return {
    id: String(row.id),
    knowledgeBaseId: String(row.knowledge_base_id),
    filename: String(row.filename),
    originalName: String(row.original_name),
    mimeType: String(row.mime_type),
    status: row.status as DocumentRecord['status'],
    pageCount: Number(row.page_count ?? 0),
    errorMessage: row.error_message ? String(row.error_message) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

export async function listDocuments(knowledgeBaseId: string): Promise<DocumentRecord[]> {
  const { rows } = await pool.query(
    `SELECT *
     FROM documents
     WHERE knowledge_base_id = $1
     ORDER BY created_at DESC`,
    [knowledgeBaseId]
  );
  return rows.map(mapDocument);
}

export async function getDocument(documentId: string): Promise<DocumentRecord | null> {
  const { rows } = await pool.query('SELECT * FROM documents WHERE id = $1', [documentId]);
  return rows[0] ? mapDocument(rows[0]) : null;
}

export async function createDocument(params: {
  knowledgeBaseId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  filePath: string;
}): Promise<DocumentRecord> {
  const { rows } = await pool.query(
    `INSERT INTO documents (knowledge_base_id, filename, original_name, mime_type, file_path, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [params.knowledgeBaseId, params.filename, params.originalName, params.mimeType, params.filePath]
  );

  const document = mapDocument(rows[0]);
  void processDocument(document.id).catch((error) => {
    logger.error({ error, documentId: document.id }, 'Document processing failed after upload');
  });

  return document;
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  const { rows } = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING file_path', [documentId]);

  if (!rows[0]) {
    return false;
  }

  await fs.unlink(rows[0].file_path).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') {
      logger.warn({ error, documentId }, 'Could not remove uploaded file');
    }
  });

  return true;
}

export async function reindexDocument(documentId: string): Promise<DocumentRecord | null> {
  const document = await getDocument(documentId);
  if (!document) {
    return null;
  }

  void processDocument(document.id).catch((error) => {
    logger.error({ error, documentId: document.id }, 'Document reindex failed');
  });

  return document;
}

export async function processDocument(documentId: string): Promise<void> {
  const { rows } = await pool.query('SELECT * FROM documents WHERE id = $1', [documentId]);
  const document = rows[0];

  if (!document) {
    return;
  }

  await pool.query(
    `UPDATE documents
     SET status = 'processing', error_message = NULL, updated_at = now()
     WHERE id = $1`,
    [documentId]
  );

  try {
    const parsed = await parseDocument(document.file_path, document.mime_type);
    const chunks = chunkPages(parsed.pages);

    if (chunks.length === 0) {
      throw new Error('没有从文件中解析出可索引文本');
    }

    const settings = await resolveAiSettings();
    const embeddings = await embedTexts(chunks.map((chunk) => chunk.content), settings);

    await withTransaction(async (client) => {
      await client.query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);

      for (const [index, chunk] of chunks.entries()) {
        await client.query(
          `INSERT INTO document_chunks (
            document_id,
            content,
            page_number,
            chunk_index,
            char_start,
            char_end,
            embedding_provider,
            embedding_model,
            embedding
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)`,
          [
            documentId,
            chunk.content,
            chunk.pageNumber,
            index,
            chunk.charStart,
            chunk.charEnd,
            settings.provider,
            settings.embeddingModel,
            toVectorLiteral(embeddings[index])
          ]
        );
      }

      await client.query(
        `UPDATE documents
         SET status = 'ready', page_count = $2, error_message = NULL, updated_at = now()
         WHERE id = $1`,
        [documentId, parsed.pageCount]
      );
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '文档处理失败';
    await pool.query(
      `UPDATE documents
       SET status = 'failed', error_message = $2, updated_at = now()
       WHERE id = $1`,
      [documentId, message]
    );
    throw error;
  }
}

export function makeStoredFilename(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]+/g, '-')
    .slice(0, 80)
    .replace(/^-+|-+$/g, '');
  return `${Date.now()}-${baseName || 'document'}${extension}`;
}

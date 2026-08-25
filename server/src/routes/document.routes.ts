import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { DEFAULT_KNOWLEDGE_BASE_ID } from '../db/schema.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { HttpError } from '../middleware/error-handler.js';
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  makeStoredFilename,
  reindexDocument
} from '../services/document.service.js';

export const documentRouter = Router();

const supportedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv'
]);

const supportedExtensions = new Set(['.pdf', '.docx', '.txt', '.md', '.csv']);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    void fs
      .mkdir(env.UPLOAD_DIR, { recursive: true })
      .then(() => callback(null, env.UPLOAD_DIR))
      .catch((error) => callback(error as Error, env.UPLOAD_DIR));
  },
  filename: (_req, file, callback) => {
    callback(null, makeStoredFilename(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (supportedMimeTypes.has(file.mimetype) || supportedExtensions.has(extension)) {
      callback(null, true);
      return;
    }

    callback(new HttpError(400, '仅支持 PDF、Word .docx、TXT、Markdown 和 CSV 文件'));
  }
});

const listDocumentsSchema = z.object({
  knowledgeBaseId: z.string().uuid().default(DEFAULT_KNOWLEDGE_BASE_ID)
});

documentRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listDocumentsSchema.parse(req.query);
    res.json(await listDocuments(query.knowledgeBaseId));
  })
);

documentRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const knowledgeBaseId = z
      .string()
      .uuid()
      .default(DEFAULT_KNOWLEDGE_BASE_ID)
      .parse(req.body.knowledgeBaseId || undefined);

    if (!req.file) {
      throw new HttpError(400, '请上传文件');
    }

    const document = await createDocument({
      knowledgeBaseId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      filePath: req.file.path
    });

    res.status(201).json(document);
  })
);

documentRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const document = await getDocument(z.string().uuid().parse(req.params.id));
    if (!document) {
      throw new HttpError(404, '文档不存在');
    }
    res.json(document);
  })
);

documentRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteDocument(z.string().uuid().parse(req.params.id));
    if (!deleted) {
      throw new HttpError(404, '文档不存在');
    }
    res.status(204).send();
  })
);

documentRouter.post(
  '/:id/reindex',
  asyncHandler(async (req, res) => {
    const document = await reindexDocument(z.string().uuid().parse(req.params.id));
    if (!document) {
      throw new HttpError(404, '文档不存在');
    }
    res.status(202).json(document);
  })
);

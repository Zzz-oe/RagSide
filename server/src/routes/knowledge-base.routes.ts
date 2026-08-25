import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.js';
import { createKnowledgeBase, listKnowledgeBases } from '../services/knowledge-base.service.js';

export const knowledgeBaseRouter = Router();

const createKnowledgeBaseSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

knowledgeBaseRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await listKnowledgeBases());
  })
);

knowledgeBaseRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createKnowledgeBaseSchema.parse(req.body);
    const knowledgeBase = await createKnowledgeBase(body.name);
    res.status(201).json(knowledgeBase);
  })
);


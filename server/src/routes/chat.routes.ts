import { Router } from 'express';
import { z } from 'zod';
import { DEFAULT_KNOWLEDGE_BASE_ID } from '../db/schema.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { askQuestion, listMessages } from '../services/chat.service.js';

export const chatRouter = Router();

const askSchema = z.object({
  knowledgeBaseId: z.string().uuid().default(DEFAULT_KNOWLEDGE_BASE_ID),
  conversationId: z.string().uuid().optional(),
  question: z.string().trim().min(1).max(2000)
});

chatRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = askSchema.parse(req.body);
    const result = await askQuestion(body);
    res.json(result);
  })
);

chatRouter.post(
  '/stream',
  asyncHandler(async (req, res) => {
    const body = askSchema.parse(req.body);
    const result = await askQuestion(body);
    res.json(result);
  })
);

chatRouter.get(
  '/conversations/:id/messages',
  asyncHandler(async (req, res) => {
    const conversationId = z.string().uuid().parse(req.params.id);
    res.json(await listMessages(conversationId));
  })
);


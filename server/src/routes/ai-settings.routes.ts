import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.js';
import { getAiSettings, updateAiSettings } from '../services/ai-settings.service.js';

export const aiSettingsRouter = Router();

const aiSettingsSchema = z.object({
  provider: z.enum(['ollama', 'openai_compatible']),
  baseUrl: z.string().url(),
  chatModel: z.string().trim().min(1).max(120),
  embeddingModel: z.string().trim().min(1).max(120),
  apiKey: z.string().trim().optional(),
  clearApiKey: z.boolean().optional().default(false)
});

aiSettingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await getAiSettings());
  })
);

aiSettingsRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const body = aiSettingsSchema.parse(req.body);
    const settings = await updateAiSettings(body);
    res.json(settings);
  })
);


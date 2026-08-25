import express from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { aiSettingsRouter } from './routes/ai-settings.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { documentRouter } from './routes/document.routes.js';
import { knowledgeBaseRouter } from './routes/knowledge-base.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: false
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test'
    })
  );

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/knowledge-bases', knowledgeBaseRouter);
  app.use('/api/ai-settings', aiSettingsRouter);
  app.use('/api/documents', documentRouter);
  app.use('/api/chat', chatRouter);

  app.use(errorHandler);

  return app;
}

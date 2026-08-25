import { promises as fs } from 'node:fs';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initDb } from './db/schema.js';
import { createApp } from './app.js';

async function bootstrap(): Promise<void> {
  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
  await initDb();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`Private RAG API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to start API server');
  process.exit(1);
});


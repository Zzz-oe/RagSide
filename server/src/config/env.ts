import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });
dotenv.config();

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(dirname, '..', '..');
const workspaceRoot = path.resolve(serverRoot, '..');

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgres://rag:rag@localhost:5432/rag'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(25),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_CHAT_MODEL: z.string().default('qwen3:4b'),
  OLLAMA_EMBEDDING_MODEL: z.string().default('nomic-embed-text'),
  CHUNK_SIZE: z.coerce.number().int().min(200).default(800),
  CHUNK_OVERLAP: z.coerce.number().int().min(0).default(100),
  RETRIEVAL_TOP_K: z.coerce.number().int().min(1).max(20).default(5),
  RETRIEVAL_MIN_SCORE: z.coerce.number().min(-1).max(1).default(0.15)
});

dotenv.config({ path: path.resolve(workspaceRoot, '.env') });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const uploadDir = path.isAbsolute(parsed.data.UPLOAD_DIR)
  ? parsed.data.UPLOAD_DIR
  : path.resolve(serverRoot, parsed.data.UPLOAD_DIR);

export const env = {
  ...parsed.data,
  UPLOAD_DIR: uploadDir,
  MAX_FILE_SIZE_BYTES: parsed.data.MAX_FILE_SIZE_MB * 1024 * 1024
};

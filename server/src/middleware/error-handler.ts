import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: '请求参数不正确',
      issues: error.flatten().fieldErrors
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ message: '文件超过允许大小' });
    return;
  }

  logger.error({ error }, 'Unhandled API error');
  res.status(500).json({ message: '服务器处理失败' });
};


import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';
import { ImvuApiError } from '../types/index.js';

const errorHandler = (
  err: Error | ImvuApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`Error: ${err.message}`);
  const statusCode = err instanceof ImvuApiError ? err.statusCode : (err as Error & { statusCode?: number }).statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err instanceof ImvuApiError ? err.code : undefined;
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export default errorHandler;

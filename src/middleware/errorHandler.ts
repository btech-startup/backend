import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[${req.method}] ${req.url} - ${statusCode}: ${message}`);

  sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

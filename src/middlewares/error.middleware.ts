import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('🔥 Global Error Handler:', err);

  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // In production, mask internal server / database errors
  if (env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected server error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

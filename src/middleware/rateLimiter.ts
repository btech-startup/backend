import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

const requestsMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (maxRequests: number = 10000, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    // Allow local development and health checks without throttling
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV === 'development') {
      return next();
    }
    const now = Date.now();

    const record = requestsMap.get(ip);

    if (!record || now > record.resetTime) {
      requestsMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      sendError(res, 'Too many requests, please try again later.', 429);
      return;
    }

    record.count += 1;
    next();
  };
};

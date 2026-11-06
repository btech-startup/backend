import { Request, Response, NextFunction } from 'express';

/**
 * In-Memory Sliding-Window Rate Limiter
 * Tracks request counts per client IP or custom identifier without external dependencies.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStores = new Map<string, Map<string, RateLimitRecord>>();

// Periodic cleanup every 5 minutes to prevent memory leaks
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [, store] of rateLimitStores.entries()) {
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }
}, 5 * 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests allowed per window
  message?: string;
  prefix?: string;
  keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests from this IP. Please try again later.',
    prefix = 'global',
    keyGenerator = (req: Request) => {
      // Use X-Forwarded-For if behind proxy, fallback to ip / socket
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return ip.trim();
      }
      return req.ip || req.socket.remoteAddress || 'unknown-client';
    },
  } = options;

  if (!rateLimitStores.has(prefix)) {
    rateLimitStores.set(prefix, new Map<string, RateLimitRecord>());
  }

  const store = rateLimitStores.get(prefix)!;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        message,
        retryAfter: `${retryAfterSeconds}s`,
      });
      return;
    }

    next();
  };
};

/**
 * Rate Limiter for Authentication & OTP routes
 * Restricts brute force and SMS bombing attempts (e.g. 10 requests per 5 minutes per IP)
 */
export const authRateLimiter = createRateLimiter({
  prefix: 'auth',
  windowMs: 5 * 60 * 1000,
  maxRequests: 15,
  message: 'Too many authentication attempts. Please wait 5 minutes before trying again.',
});

/**
 * Rate Limiter for Deal & Chatbot negotiations
 */
export const dealRateLimiter = createRateLimiter({
  prefix: 'deals',
  windowMs: 1 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many negotiation requests. Please slow down.',
});

/**
 * Security HTTP Headers Middleware
 * Protects against XSS, clickjacking, MIME sniffing, and leaks without external packages.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Auditor filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Restrict referrer data
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:;"
  );

  // Strict Transport Security (HSTS) - enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove Express signature
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Deep Input Sanitization Helper
 * Strips dangerous HTML control characters, script tags, and trims strings to prevent Stored XSS.
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Strip <script> and dangerous tags, strip angle brackets
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  } else if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  } else if (value !== null && typeof value === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitizedObj[k] = sanitizeValue(v);
    }
    return sanitizedObj;
  }
  return value;
}

export const sanitizeRequestBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};


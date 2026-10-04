import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { UserRole } from '../types/index';
import { UserRepository } from '../repositories/userRepository';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication token missing or malformed', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Attempt to retrieve full user record from repository
    const dbUser = await UserRepository.findById(decoded.id);

    req.user = dbUser || {
      id: decoded.id,
      phone_number: decoded.phone_number,
      full_name: decoded.full_name || '',
      email: decoded.email,
      role: decoded.role,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401, error);
    return;
  }
};

export const requireAuth = authenticate;

export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const dbUser = await UserRepository.findById(decoded.id);

    req.user = dbUser || {
      id: decoded.id,
      phone_number: decoded.phone_number,
      full_name: decoded.full_name || '',
      email: decoded.email,
      role: decoded.role,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'User context missing', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Forbidden: Insufficient permissions for this endpoint', 403);
      return;
    }

    next();
  };
};


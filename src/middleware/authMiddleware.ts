import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { UserRole } from '../types/index';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication token missing or malformed', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      phone_number: decoded.phone_number,
      full_name: '',
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

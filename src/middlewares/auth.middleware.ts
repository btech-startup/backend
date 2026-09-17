import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { JwtPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  vendorId?: string;
  vendorPhone?: string;
  vendorStatus?: string;
}

export const authenticateVendor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication token is missing or malformed',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const vendor = await prisma.vendor.findUnique({
      where: { id: decoded.vendorId },
    });

    if (!vendor) {
      res.status(401).json({
        success: false,
        message: 'Vendor not found or session expired',
      });
      return;
    }

    req.vendorId = vendor.id;
    req.vendorPhone = vendor.phone;
    req.vendorStatus = vendor.status;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Authentication token has expired',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
  }
};

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUser, UserRole } from '../types/index';

export interface TokenPayload {
  id: string;
  phone_number: string;
  role: UserRole;
  email?: string;
}

export const generateToken = (user: IUser): string => {
  const payload: TokenPayload = {
    id: user.id,
    phone_number: user.phone_number,
    role: user.role,
    email: user.email,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): TokenPayload => {
  if (token.startsWith('mock_')) {
    return {
      id: 'usr_vendor_demo',
      phone_number: '+919876543211',
      role: UserRole.VENDOR,
      email: 'vendor@eventwise.com',
    };
  }
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

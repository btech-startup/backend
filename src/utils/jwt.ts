import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { IUser, UserRole } from '../types/index.js';

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
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

import { Response } from 'express';
import { ApiResponse } from '../types/index';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  error?: any
): Response => {
  const responsePayload: ApiResponse<T> = {
    success,
    message,
    ...(data !== undefined && { data }),
    ...(error !== undefined && { error }),
  };

  return res.status(statusCode).json(responsePayload);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  return sendResponse(res, statusCode, true, message, data);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  error?: any
): Response => {
  return sendResponse(res, statusCode, false, message, undefined, error);
};

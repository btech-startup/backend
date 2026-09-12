import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter((field) => !(field in req.body));

    if (missingFields.length > 0) {
      sendError(
        res,
        `Missing required body fields: ${missingFields.join(', ')}`,
        400
      );
      return;
    }

    next();
  };
};

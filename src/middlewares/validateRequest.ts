import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { ApiError } from './errorHandler';

interface FieldValidationError {
  field: string;
  message: string;
}

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages: FieldValidationError[] = [];
    
    errors.array().forEach((error) => {
      if ('param' in error) {
        errorMessages.push({
          field: error.param,
          message: error.msg,
        });
      } else {
        errorMessages.push({
          field: 'unknown',
          message: error.msg || 'Validation error',
        });
      }
    });
    
    throw new ApiError(400, 'Validation failed', { errors: errorMessages });
  }
  next();
};

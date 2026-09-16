import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { ApiErrorResponse } from '../types/index.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let errorName = 'InternalServerError';
  let message = 'An unexpected internal server error occurred';
  let errors: ApiErrorResponse['errors'] = [];

  // Handle custom ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorName = err.name || 'ApiError';
    message = err.message;
    errors = err.errors;
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    errorName = 'ValidationError';
    message = 'Validation failed for request data';
    errors = err.errors.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // Handle JSON parse syntax error from body-parser
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    errorName = 'BadRequest';
    message = 'Malformed JSON payload in request body';
  }
  // Generic error
  else if (err instanceof Error) {
    message = err.message;
    errorName = err.name || 'Error';
  }

  // Only log stack traces for actual server errors (500+). 4xx errors are routine client errors.
  if (env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Internal Server Error ${statusCode}:`, err);
  }

  const responsePayload: ApiErrorResponse = {
    success: false,
    statusCode,
    error: errorName,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
  };

  res.status(statusCode).json(responsePayload);
};

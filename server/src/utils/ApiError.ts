import { ApiErrorDetail } from '../types/index.js';

export class ApiError extends Error {
  public statusCode: number;
  public errors: ApiErrorDetail[];
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: ApiErrorDetail[] = [],
    isOperational: boolean = true,
    stack: string = '',
    name: string = 'ApiError'
  ) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string, errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(400, message, errors, true, '', 'BadRequest');
  }

  static validation(message: string = 'Validation failed for request data', errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(400, message, errors, true, '', 'ValidationError');
  }

  static unauthorized(message: string = 'Unauthorized: Access token is missing or invalid', errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(401, message, errors, true, '', 'UnauthorizedError');
  }

  static forbidden(message: string = 'Forbidden: You do not have permission to perform this action', errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(403, message, errors, true, '', 'ForbiddenError');
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message, [], true, '', 'ApiError');
  }

  static conflict(message: string, errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(409, message, errors, true, '', 'ConflictError');
  }

  static unprocessable(message: string, errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(422, message, errors, true, '', 'UnprocessableEntity');
  }

  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(500, message, [], false, '', 'InternalServerError');
  }
}

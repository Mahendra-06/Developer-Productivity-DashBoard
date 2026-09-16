import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: ApiResponse<T>['meta']
  ): Response {
    const responsePayload: ApiResponse<T> = {
      success: true,
      statusCode,
      message,
      data,
      ...(meta ? { meta } : {}),
    };
    return res.status(statusCode).json(responsePayload);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
    location?: string
  ): Response {
    if (location) {
      res.setHeader('Location', location);
    }
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { httpResponse, errorResponse } from '../utils/response';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(409, message, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export function errorHandler(): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> {
  return {
    onError: async (request) => {
      const error = request.error;

      if (!error) {
        request.response = httpResponse(500, errorResponse('Unknown error'));
        return;
      }

      // Handle known application errors
      if (error instanceof AppError) {
        request.response = httpResponse(error.statusCode, errorResponse(error.message));
        return;
      }

      // Handle Sequelize unique constraint violations
      if (error.name === 'SequelizeUniqueConstraintError') {
        request.response = httpResponse(409, errorResponse('Duplicate entry'));
        return;
      }

      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
        request.response = httpResponse(400, errorResponse('Database validation failed'));
        return;
      }

      // Log unexpected errors
      console.error('Unhandled error:', error);

      request.response = httpResponse(500, errorResponse('Internal server error'));
    },
  };
}

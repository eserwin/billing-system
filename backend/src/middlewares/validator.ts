import { ZodSchema, ZodError } from 'zod';
import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { httpResponse, errorResponse, ValidationError as ValidationErrorItem } from '../utils/response';

interface ValidatorOptions {
  body?: ZodSchema;
  queryStringParameters?: ZodSchema;
  pathParameters?: ZodSchema;
}

/**
 * Middleware that validates request data against Zod schemas.
 * Supports validation of body, query string parameters, and path parameters.
 */
export function validator(schemas: ValidatorOptions): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> {
  return {
    before: async (request) => {
      const errors: ValidationErrorItem[] = [];

      if (schemas.body) {
        const body = typeof request.event.body === 'string'
          ? JSON.parse(request.event.body)
          : request.event.body;

        const result = schemas.body.safeParse(body);
        if (!result.success) {
          errors.push(...mapZodErrors(result.error, 'body'));
        } else {
          (request.event as any).body = result.data;
        }
      }

      if (schemas.queryStringParameters) {
        const query = request.event.queryStringParameters || {};
        const result = schemas.queryStringParameters.safeParse(query);
        if (!result.success) {
          errors.push(...mapZodErrors(result.error, 'query'));
        } else {
          (request.event as any).queryStringParameters = result.data;
        }
      }

      if (schemas.pathParameters) {
        const params = request.event.pathParameters || {};
        const result = schemas.pathParameters.safeParse(params);
        if (!result.success) {
          errors.push(...mapZodErrors(result.error, 'path'));
        } else {
          (request.event as any).pathParameters = result.data;
        }
      }

      if (errors.length > 0) {
        return httpResponse(400, errorResponse('Validation failed', errors));
      }
    },
  };
}

function mapZodErrors(error: ZodError, source: string): ValidationErrorItem[] {
  return error.issues.map((issue) => ({
    field: `${source}.${issue.path.join('.')}`,
    message: issue.message,
    code: issue.code,
  }));
}

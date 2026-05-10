import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { customerIdParamSchema, reconnectBodySchema } from '../../validators/mikrotikSchema';
import { reconnect } from '../../services/mikrotikService';
import { httpResponse, successResponse, errorResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { id } = event.pathParameters as { id: string };
  const { reason } = event.body as unknown as { reason: string };
  const auth = (event as any).auth;

  const result = await reconnect(id, reason, auth?.userId);

  if (!result.success) {
    return httpResponse(400, errorResponse(result.message));
  }

  return httpResponse(200, successResponse(result));
}

export const main = middy(handler)
  .use(httpJsonBodyParser())
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ pathParameters: customerIdParamSchema, body: reconnectBodySchema }))
  .use(errorHandler());

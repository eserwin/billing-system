import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { errorHandler } from '../../middlewares/errorHandler';
import { getActivityLogs } from '../../services/auditService';
import { httpResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.pathParameters?.id;
  if (!userId) {
    return httpResponse(400, { success: false, message: 'User ID is required' });
  }

  const query = (event.queryStringParameters || {}) as Record<string, string>;
  const pagination = parsePaginationParams(query);
  const result = await getActivityLogs(userId, pagination);
  return httpResponse(200, paginatedResponse(result));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN]))
  .use(errorHandler());

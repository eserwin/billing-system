import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { errorHandler } from '../../middlewares/errorHandler';
import { getActiveSessions } from '../../services/mikrotikService';
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const sessions = await getActiveSessions();
  return httpResponse(200, successResponse(sessions));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(errorHandler());

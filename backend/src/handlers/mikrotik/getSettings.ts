import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { errorHandler } from '../../middlewares/errorHandler';
import { getSettings } from '../../services/mikrotikService';
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const settings = await getSettings();
  return httpResponse(200, successResponse(settings));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(errorHandler());

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { updateSettingsBodySchema } from '../../validators/mikrotikSchema';
import { updateSettings } from '../../services/mikrotikService';
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = event.body as unknown as { enabled?: boolean; overdue_threshold_days?: number };
  const auth = (event as any).auth;

  const settings = await updateSettings(body, auth?.userId);
  return httpResponse(200, successResponse(settings));
}

export const main = middy(handler)
  .use(httpJsonBodyParser())
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN]))
  .use(validator({ body: updateSettingsBodySchema }))
  .use(errorHandler());

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { updateUserSchema } from '../../validators/userSchema';
import { updateUser } from '../../services/userService';
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) {
    return httpResponse(400, { success: false, message: 'User ID is required' });
  }

  const body = event.body as unknown as ReturnType<typeof updateUserSchema.parse>;
  const auth = (event as any).auth;
  const user = await updateUser(id, body, auth?.userId);
  return httpResponse(200, successResponse(user));
}

export const main = middy(handler)
  .use(httpJsonBodyParser())
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN]))
  .use(validator({ body: updateUserSchema }))
  .use(errorHandler());

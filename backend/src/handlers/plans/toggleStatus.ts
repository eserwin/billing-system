import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { planIdParamSchema, togglePlanStatusSchema } from '../../validators/planSchema';
import { planService } from '../../services';

const { togglePlanStatus } = planService;
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { id } = event.pathParameters as { id: string };
  const body = event.body as unknown as ReturnType<typeof togglePlanStatusSchema.parse>;
  const plan = await togglePlanStatus(id, body.is_active);
  return httpResponse(200, successResponse(plan));
}

export const main = middy(handler)
  .use(httpJsonBodyParser())
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ pathParameters: planIdParamSchema, body: togglePlanStatusSchema }))
  .use(errorHandler());

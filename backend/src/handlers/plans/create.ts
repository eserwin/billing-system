import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { createPlanSchema } from '../../validators/planSchema';
import { planService } from '../../services';

const { createPlan } = planService;
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = event.body as unknown as ReturnType<typeof createPlanSchema.parse>;
  const plan = await createPlan(body);
  return httpResponse(201, successResponse(plan));
}

export const main = middy(handler)
  .use(httpJsonBodyParser())
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ body: createPlanSchema }))
  .use(errorHandler());

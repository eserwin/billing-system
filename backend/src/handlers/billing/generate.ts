import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { generateInvoicesSchema } from '../../validators/billingSchema';
import { billingService } from '../../services';

const { generateMonthlyInvoices } = billingService;
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = event.body as unknown as ReturnType<typeof generateInvoicesSchema.parse>;
  const result = await generateMonthlyInvoices(body);
  return httpResponse(200, successResponse(result));
}

export const main = middy(handler)
  .use(httpJsonBodyParser())
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ body: generateInvoicesSchema }))
  .use(errorHandler());

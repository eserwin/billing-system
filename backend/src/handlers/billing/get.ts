import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { invoiceIdParamSchema } from '../../validators/billingSchema';
import { billingService } from '../../services';

const { getInvoice } = billingService;
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { id } = event.pathParameters as { id: string };
  const invoice = await getInvoice(id);
  return httpResponse(200, successResponse(invoice));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ pathParameters: invoiceIdParamSchema }))
  .use(errorHandler());

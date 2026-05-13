import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { recordPaymentSchema } from '../../validators/paymentSchema';
import { paymentService } from '../../services';

const { recordPayment } = paymentService;
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = event.body as unknown as ReturnType<typeof recordPaymentSchema.parse>;
  const recordedBy = (event as any).auth?.userId || '';
  const result = await recordPayment(body, recordedBy);
  return httpResponse(201, successResponse(result));
}

export const main = middy(handler)
  .use(httpJsonBodyParser())
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CASHIER]))
  .use(validator({ body: recordPaymentSchema }))
  .use(errorHandler());

import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { billingSummaryQuerySchema } from '../../validators/billingSchema';
import { getBillingSummary } from '../../services/billingService';
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const query = (event.queryStringParameters || {}) as Record<string, string>;

  const periodYear = query.period_year ? parseInt(query.period_year, 10) : undefined;
  const periodMonth = query.period_month ? parseInt(query.period_month, 10) : undefined;

  const summary = await getBillingSummary(periodYear, periodMonth);
  return httpResponse(200, successResponse(summary));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ queryStringParameters: billingSummaryQuerySchema }))
  .use(errorHandler());

import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { monthlyIncomeQuerySchema } from '../../validators/reportSchema';
import { reportService } from '../../services';

const { getMonthlyIncomeReport } = reportService;
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const query = (event.queryStringParameters || {}) as Record<string, string>;

  const year = parseInt(query.year, 10);

  const report = await getMonthlyIncomeReport(year);
  return httpResponse(200, successResponse(report));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ queryStringParameters: monthlyIncomeQuerySchema }))
  .use(errorHandler());

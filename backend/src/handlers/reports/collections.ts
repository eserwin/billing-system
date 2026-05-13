import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { collectionReportQuerySchema } from '../../validators/reportSchema';
import { reportService } from '../../services';

const { getCollectionReport } = reportService;
import { httpResponse, successResponse } from '../../utils/response';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const query = (event.queryStringParameters || {}) as Record<string, string>;

  const dateFrom = query.date_from;
  const dateTo = query.date_to;

  const report = await getCollectionReport(dateFrom, dateTo);
  return httpResponse(200, successResponse(report));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ queryStringParameters: collectionReportQuerySchema }))
  .use(errorHandler());

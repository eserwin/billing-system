import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { planListQuerySchema } from '../../validators/planSchema';
import { planService } from '../../services';

const { listPlans } = planService;
type PlanFilters = { is_active?: string; search?: string };
import { httpResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const query = (event.queryStringParameters || {}) as Record<string, string>;
  const pagination = parsePaginationParams(query);

  const filters: PlanFilters = {
    is_active: query.is_active,
    search: query.search,
  };

  const result = await listPlans(filters, pagination);
  return httpResponse(200, paginatedResponse(result));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CASHIER]))
  .use(validator({ queryStringParameters: planListQuerySchema }))
  .use(errorHandler());

import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { customerListQuerySchema } from '../../validators/customerSchema';
import { customerService } from '../../services';

const { listCustomers } = customerService;
type CustomerFilters = { status?: string; service_area?: string; plan_id?: string; search?: string };
import { httpResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const query = (event.queryStringParameters || {}) as Record<string, string>;
  const pagination = parsePaginationParams(query);

  const filters: CustomerFilters = {
    status: query.status,
    service_area: query.service_area,
    plan_id: query.plan_id,
    search: query.search,
  };

  const result = await listCustomers(filters, pagination);
  return httpResponse(200, paginatedResponse(result));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ queryStringParameters: customerListQuerySchema }))
  .use(errorHandler());

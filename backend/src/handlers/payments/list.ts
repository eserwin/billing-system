import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { paymentListQuerySchema } from '../../validators/paymentSchema';
import { paymentService } from '../../services';

const { listPayments } = paymentService;
type PaymentFilters = { customer_id?: string; invoice_id?: string; method?: string; date_from?: string; date_to?: string; search?: string };
import { httpResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const query = (event.queryStringParameters || {}) as Record<string, string>;
  const pagination = parsePaginationParams(query);

  const filters: PaymentFilters = {
    customer_id: query.customer_id,
    invoice_id: query.invoice_id,
    method: query.method,
    date_from: query.date_from,
    date_to: query.date_to,
    search: query.search,
  };

  const result = await listPayments(filters, pagination);
  return httpResponse(200, paginatedResponse(result));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ queryStringParameters: paymentListQuerySchema }))
  .use(errorHandler());

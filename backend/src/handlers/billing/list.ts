import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { validator } from '../../middlewares/validator';
import { errorHandler } from '../../middlewares/errorHandler';
import { invoiceListQuerySchema } from '../../validators/billingSchema';
import { billingService } from '../../services';

const { listInvoices } = billingService;
type InvoiceFilters = { status?: string; customer_id?: string; period_year?: string; period_month?: string; search?: string };
import { httpResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';
import { UserRole } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const query = (event.queryStringParameters || {}) as Record<string, string>;
  const pagination = parsePaginationParams(query);

  const filters: InvoiceFilters = {
    status: query.status,
    customer_id: query.customer_id,
    period_year: query.period_year,
    period_month: query.period_month,
    search: query.search,
  };

  const result = await listInvoices(filters, pagination);
  return httpResponse(200, paginatedResponse(result));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(validator({ queryStringParameters: invoiceListQuerySchema }))
  .use(errorHandler());

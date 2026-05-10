import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { errorHandler } from '../../middlewares/errorHandler';
import { getNotificationLogs, NotificationFilters } from '../../services/notificationService';
import { httpResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';
import { UserRole, NotificationChannel, NotificationType, NotificationStatus } from '../../types/common';

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const query = event.queryStringParameters || {};
  const pagination = parsePaginationParams(query);

  const filters: NotificationFilters = {};

  if (query.customer_id) {
    filters.customer_id = query.customer_id;
  }
  if (query.channel && Object.values(NotificationChannel).includes(query.channel as NotificationChannel)) {
    filters.channel = query.channel as NotificationChannel;
  }
  if (query.type && Object.values(NotificationType).includes(query.type as NotificationType)) {
    filters.type = query.type as NotificationType;
  }
  if (query.status && Object.values(NotificationStatus).includes(query.status as NotificationStatus)) {
    filters.status = query.status as NotificationStatus;
  }
  if (query.date_from) {
    filters.date_from = query.date_from;
  }
  if (query.date_to) {
    filters.date_to = query.date_to;
  }

  const result = await getNotificationLogs(filters, pagination);

  return httpResponse(200, paginatedResponse(result));
}

export const main = middy(handler)
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(errorHandler());

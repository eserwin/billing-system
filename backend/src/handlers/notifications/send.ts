import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authMiddleware } from '../../middlewares/auth';
import { roleGuard } from '../../middlewares/roleGuard';
import { errorHandler } from '../../middlewares/errorHandler';
import {
  sendDueReminder,
  sendOverdueNotice,
  sendPaymentConfirmation,
  sendDisconnectWarning,
  sendReconnectConfirmation,
} from '../../services/notificationService';
import { httpResponse, successResponse, errorResponse } from '../../utils/response';
import { UserRole, NotificationType } from '../../types/common';

interface SendNotificationBody {
  customer_id?: string;
  payment_id?: string;
  type: NotificationType;
}

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = event.body as unknown as SendNotificationBody;

  if (!body.type) {
    return httpResponse(400, errorResponse('Notification type is required'));
  }

  let results;

  switch (body.type) {
    case NotificationType.DUE_REMINDER:
      if (!body.customer_id) {
        return httpResponse(400, errorResponse('customer_id is required for due reminders'));
      }
      results = await sendDueReminder(body.customer_id);
      break;

    case NotificationType.OVERDUE_NOTICE:
      if (!body.customer_id) {
        return httpResponse(400, errorResponse('customer_id is required for overdue notices'));
      }
      results = await sendOverdueNotice(body.customer_id);
      break;

    case NotificationType.PAYMENT_CONFIRMATION:
      if (!body.payment_id) {
        return httpResponse(400, errorResponse('payment_id is required for payment confirmations'));
      }
      results = await sendPaymentConfirmation(body.payment_id);
      break;

    case NotificationType.DISCONNECT_WARNING:
      if (!body.customer_id) {
        return httpResponse(400, errorResponse('customer_id is required for disconnect warnings'));
      }
      results = await sendDisconnectWarning(body.customer_id);
      break;

    case NotificationType.RECONNECT_CONFIRMATION:
      if (!body.customer_id) {
        return httpResponse(400, errorResponse('customer_id is required for reconnect confirmations'));
      }
      results = await sendReconnectConfirmation(body.customer_id);
      break;

    default:
      return httpResponse(400, errorResponse(`Invalid notification type: ${body.type}`));
  }

  return httpResponse(200, successResponse(results));
}

export const main = middy(handler)
  .use(httpJsonBodyParser())
  .use(authMiddleware())
  .use(roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
  .use(errorHandler());

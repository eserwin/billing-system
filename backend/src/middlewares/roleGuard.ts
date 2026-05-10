import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { httpResponse, errorResponse } from '../utils/response';
import { UserRole } from '../types/common';

/**
 * Middleware that enforces role-based access control.
 * Must be used after authMiddleware so that request.auth is populated.
 *
 * @param allowedRoles - Array of roles permitted to access the endpoint
 */
export function roleGuard(
  allowedRoles: (UserRole | string)[]
): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> {
  return {
    before: async (request) => {
      const auth = (request as any).auth;

      if (!auth) {
        return httpResponse(401, errorResponse('Authentication required'));
      }

      const hasPermission = auth.groups.some((group: string) =>
        allowedRoles.includes(group)
      );

      if (!hasPermission) {
        return httpResponse(403, errorResponse('Insufficient permissions'));
      }
    },
  };
}

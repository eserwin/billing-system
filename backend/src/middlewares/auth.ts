import { CognitoJwtVerifier } from 'aws-jwt-verify';
import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { httpResponse, errorResponse } from '../utils/response';

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  groups: string[];
}

declare module '@middy/core' {
  interface Request {
    auth?: AuthContext;
  }
}

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier) {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;

    if (!userPoolId || !clientId) {
      throw new Error('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set');
    }

    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'access',
      clientId,
    });
  }
  return verifier;
}

export function authMiddleware(): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> {
  return {
    before: async (request) => {
      const authHeader = request.event.headers?.Authorization || request.event.headers?.authorization;

      if (!authHeader) {
        return httpResponse(401, errorResponse('Missing authorization token'));
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      if (!token) {
        return httpResponse(401, errorResponse('Missing authorization token'));
      }

      try {
        const payload = await getVerifier().verify(token);

        const groups: string[] = (payload['cognito:groups'] as string[]) || [];
        const role = groups[0] || 'Cashier';

        const authContext: AuthContext = {
          userId: payload.sub,
          email: (payload.email as string) || '',
          role,
          groups,
        };

        request.auth = authContext;
        // Also attach to event for handler access
        (request.event as any).auth = authContext;
      } catch {
        return httpResponse(401, errorResponse('Invalid or expired token'));
      }
    },
  };
}

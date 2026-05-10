import { useAuthStore } from '@/stores/auth';
import type { AuthUser } from '@/stores/auth';

// DEV BYPASS: skip Cognito entirely
const DEV_BYPASS_AUTH = true;

function parseIdToken(idToken: string): AuthUser {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  const groups: string[] = payload['cognito:groups'] || [];
  let role: AuthUser['role'] = 'Cashier';
  if (groups.includes('SuperAdmin')) role = 'SuperAdmin';
  else if (groups.includes('Admin')) role = 'Admin';

  return {
    email: payload.email || '',
    name: payload.name || payload.email || '',
    role,
    sub: payload.sub,
  };
}

export function useAuth() {
  const store = useAuthStore();

  async function login(email: string, password: string): Promise<void> {
    if (DEV_BYPASS_AUTH) {
      store.setUser({ email: 'admin@isp.local', name: 'Dev Admin', role: 'SuperAdmin', sub: 'dev-user-001' });
      return;
    }

    store.setLoading(true);
    store.setError(null);

    const { CognitoUserPool, CognitoUser, AuthenticationDetails } = await import('amazon-cognito-identity-js');
    const userPool = new CognitoUserPool({
      UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    });

    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess(session) {
          const accessToken = session.getAccessToken().getJwtToken();
          const idToken = session.getIdToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();

          store.setTokens({ accessToken, idToken, refreshToken });
          store.setUser(parseIdToken(idToken));
          store.setLoading(false);
          resolve();
        },
        onFailure(err) {
          store.setError('Invalid email or password');
          store.setLoading(false);
          reject(err);
        },
        newPasswordRequired() {
          store.setError('Password change required. Contact your administrator.');
          store.setLoading(false);
          reject(new Error('NEW_PASSWORD_REQUIRED'));
        },
      });
    });
  }

  function logout(): void {
    store.clearAuth();
  }

  async function restoreSession(): Promise<void> {
    if (DEV_BYPASS_AUTH) return;

    const { CognitoUserPool } = await import('amazon-cognito-identity-js');
    const userPool = new CognitoUserPool({
      UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    });

    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        store.clearAuth();
        resolve();
        return;
      }

      cognitoUser.getSession((err: Error | null, session: any) => {
        if (err || !session || !session.isValid()) {
          store.clearAuth();
          resolve();
          return;
        }

        const accessToken = session.getAccessToken().getJwtToken();
        const idToken = session.getIdToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        store.setTokens({ accessToken, idToken, refreshToken });
        store.setUser(parseIdToken(idToken));
        resolve();
      });
    });
  }

  return { login, logout, restoreSession };
}

export async function refreshSession(): Promise<string | null> {
  if (DEV_BYPASS_AUTH) return 'dev-bypass-token';

  const { CognitoUserPool } = await import('amazon-cognito-identity-js');
  const userPool = new CognitoUserPool({
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  });

  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      const accessToken = session.getAccessToken().getJwtToken();
      localStorage.setItem('accessToken', accessToken);
      resolve(accessToken);
    });
  });
}

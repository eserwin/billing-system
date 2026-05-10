import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface AuthUser {
  email: string;
  name: string;
  role: 'SuperAdmin' | 'Admin' | 'Cashier';
  sub: string;
}

export const useAuthStore = defineStore('auth', () => {
  // SET TO false WHEN COGNITO IS CONFIGURED
  const DEV_BYPASS_AUTH = true;

  const devUser: AuthUser = { email: 'admin@isp.local', name: 'Dev Admin', role: 'SuperAdmin', sub: 'dev-user-001' };
  if (DEV_BYPASS_AUTH) {
    localStorage.setItem('isp_user', JSON.stringify(devUser));
  }

  const user = ref<AuthUser | null>(DEV_BYPASS_AUTH ? devUser : null);
  const accessToken = ref<string | null>(
    DEV_BYPASS_AUTH ? 'dev-bypass-token' : localStorage.getItem('accessToken')
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => DEV_BYPASS_AUTH || !!accessToken.value);
  const userRole = computed(() => user.value?.role ?? null);

  function setTokens(tokens: { accessToken: string; idToken: string; refreshToken: string }) {
    accessToken.value = tokens.accessToken;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('idToken', tokens.idToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  function setUser(authUser: AuthUser) {
    user.value = authUser;
    localStorage.setItem('isp_user', JSON.stringify(authUser));
  }

  function clearAuth() {
    user.value = null;
    accessToken.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isp_user');
  }

  function setLoading(val: boolean) {
    loading.value = val;
  }

  function setError(msg: string | null) {
    error.value = msg;
  }

  return {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated,
    userRole,
    setTokens,
    setUser,
    clearAuth,
    setLoading,
    setError,
  };
});

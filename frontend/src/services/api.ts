import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { mockCustomers, mockPlans, mockInvoices, mockPayments, mockDashboard, mockMonthlyIncome } from './mockData';

// SET TO false WHEN BACKEND API IS RUNNING
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock interceptor - returns fake data without hitting the backend
if (USE_MOCK_DATA) {
  api.interceptors.request.use((config) => {
    const url = config.url || '';
    const method = config.method || 'get';
    let responseData: any = { success: true, data: [] };

    // Dashboard
    if (url.includes('/reports/dashboard')) {
      responseData = { success: true, data: mockDashboard };
    }
    // Monthly income
    else if (url.includes('/reports/monthly')) {
      responseData = { success: true, data: mockMonthlyIncome };
    }
    // Collection report
    else if (url.includes('/reports/collections')) {
      responseData = { success: true, data: { payments: mockPayments, total_amount: 149900, total_count: 2, date_from: '2024-05-01', date_to: '2024-05-31' } };
    }
    // Overdue report
    else if (url.includes('/reports/overdue')) {
      responseData = { success: true, data: { customers: [{ customer_id: 'c3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', customer_name: 'Pedro Reyes', account_number: 'ISP-2024-0003', plan_name: 'Plan 999', outstanding_amount: 49900, overdue_invoices: 1, oldest_due_date: '2024-05-20' }, { customer_id: 'c4a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', customer_name: 'Ana Garcia', account_number: 'ISP-2024-0004', plan_name: 'Plan 599', outstanding_amount: 59900, overdue_invoices: 1, oldest_due_date: '2024-04-25' }], total_outstanding: 109800, total_count: 2 } };
    }
    // Single customer
    else if (url.match(/\/customers\/[^/]+$/) && method === 'get') {
      const id = url.split('/').pop();
      const customer = mockCustomers.find(c => c.id === id) || mockCustomers[0];
      responseData = { success: true, data: customer };
    }
    // Customer list
    else if (url.includes('/customers') && method === 'get') {
      responseData = { success: true, data: mockCustomers, meta: { total: mockCustomers.length, page: 1, limit: 10, total_pages: 1 } };
    }
    // Create/update customer
    else if (url.includes('/customers') && (method === 'post' || method === 'put')) {
      responseData = { success: true, data: { ...mockCustomers[0], ...config.data } };
    }
    // Plans
    else if (url.includes('/plans') && method === 'get') {
      responseData = { success: true, data: mockPlans, meta: { total: mockPlans.length, page: 1, limit: 10, total_pages: 1 } };
    }
    // Billing list
    else if (url.includes('/billing') && method === 'get' && !url.match(/\/billing\/[^/]+$/)) {
      responseData = { success: true, data: mockInvoices, meta: { total: mockInvoices.length, page: 1, limit: 10, total_pages: 1 } };
    }
    // Single invoice
    else if (url.match(/\/billing\/[^/]+$/) && method === 'get') {
      const id = url.split('/').pop();
      const invoice = mockInvoices.find(i => i.id === id) || mockInvoices[0];
      responseData = { success: true, data: invoice };
    }
    // Payments list
    else if (url.includes('/payments') && method === 'get' && !url.match(/\/payments\/[^/]+$/)) {
      responseData = { success: true, data: mockPayments, meta: { total: mockPayments.length, page: 1, limit: 10, total_pages: 1 } };
    }
    // Single payment
    else if (url.match(/\/payments\/[^/]+$/) && method === 'get') {
      responseData = { success: true, data: mockPayments[0] };
    }
    // Record payment
    else if (url.includes('/payments') && method === 'post') {
      responseData = { success: true, data: { id: 'pay-new', ...config.data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } };
    }
    // Catch-all
    else {
      responseData = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, total_pages: 0 } };
    }

    return Promise.reject({
      config,
      response: { data: responseData, status: 200, statusText: 'OK', headers: {}, config },
      isAxiosError: false,
      __MOCK__: true,
    });
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.__MOCK__) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
} else {
  // Real API interceptors
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const { refreshSession } = await import('@/composables/useAuth');
          const newToken = await refreshSession();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('idToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }
  );
}

export default api;

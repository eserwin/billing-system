import api from './api';

export interface DashboardMetrics {
  total_active_customers: number;
  total_overdue_customers: number;
  total_disconnected_customers: number;
  daily_collections: number;
  monthly_revenue: number;
  recent_payments: RecentPayment[];
  recent_disconnections: RecentDisconnection[];
}

export interface RecentPayment {
  id: string;
  customer_name: string;
  amount: number;
  method: string;
  payment_date: string;
  created_at: string;
}

export interface RecentDisconnection {
  id: string;
  customer_name: string;
  action: string;
  success: boolean;
  created_at: string;
}

export interface CollectionReport {
  payments: CollectionPaymentItem[];
  total_amount: number;
  total_count: number;
  date_from: string;
  date_to: string;
}

export interface CollectionPaymentItem {
  id: string;
  customer_id: string;
  customer_name: string;
  account_number: string;
  amount: number;
  method: string;
  reference_number: string | null;
  payment_date: string;
}

export interface MonthlyIncomeReport {
  year: number;
  months: MonthlyIncomeItem[];
  total_annual: number;
}

export interface MonthlyIncomeItem {
  month: number;
  month_name: string;
  total_payments: number;
  payment_count: number;
}

export interface OverdueReport {
  customers: OverdueCustomerItem[];
  total_outstanding: number;
  total_count: number;
}

export interface OverdueCustomerItem {
  customer_id: string;
  customer_name: string;
  account_number: string;
  plan_name: string;
  outstanding_amount: number;
  overdue_invoices: number;
  oldest_due_date: string;
}

interface SingleResponse<T> {
  success: true;
  data: T;
}

export async function fetchDashboardMetrics(): Promise<SingleResponse<DashboardMetrics>> {
  const { data } = await api.get('/reports/dashboard');
  return data;
}

export async function fetchCollectionReport(dateFrom: string, dateTo: string): Promise<SingleResponse<CollectionReport>> {
  const { data } = await api.get('/reports/collections', {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return data;
}

export async function fetchMonthlyIncomeReport(year: number): Promise<SingleResponse<MonthlyIncomeReport>> {
  const { data } = await api.get('/reports/monthly', {
    params: { year: String(year) },
  });
  return data;
}

export async function fetchOverdueReport(): Promise<SingleResponse<OverdueReport>> {
  const { data } = await api.get('/reports/overdue');
  return data;
}

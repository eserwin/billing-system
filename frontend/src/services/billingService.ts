import api from './api';
import type { PaginatedResponse, SingleResponse } from './customerService';

export interface IInvoice {
  id: string;
  customer_id: string;
  plan_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  paid_amount: number;
  status: 'unpaid' | 'paid' | 'partial' | 'overdue';
  due_date: string;
  disconnected_days: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer?: {
    id: string;
    account_number: string;
    full_name: string;
  };
  plan?: {
    id: string;
    name: string;
    speed: string;
    monthly_fee: number;
  };
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  status?: string;
  customer_id?: string;
  period_year?: number;
  period_month?: number;
}

export async function fetchInvoices(params: InvoiceListParams = {}): Promise<PaginatedResponse<IInvoice>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.sort_by) query.sort_by = params.sort_by;
  if (params.sort_order) query.sort_order = params.sort_order;
  if (params.status) query.status = params.status;
  if (params.customer_id) query.customer_id = params.customer_id;
  if (params.period_year) query.period_year = String(params.period_year);
  if (params.period_month) query.period_month = String(params.period_month);

  const { data } = await api.get('/billing', { params: query });
  return data;
}

export async function fetchInvoice(id: string): Promise<SingleResponse<IInvoice>> {
  const { data } = await api.get(`/billing/${id}`);
  return data;
}

export async function generateBilling(): Promise<{ success: true; data: { generated: number } }> {
  const { data } = await api.post('/billing/generate');
  return data;
}

export async function exportInvoicePdf(id: string): Promise<Blob> {
  const { data } = await api.get(`/billing/${id}/pdf`, { responseType: 'blob' });
  return data;
}

import api from './api';
import type { PaginatedResponse, SingleResponse } from './customerService';

export interface IPayment {
  id: string;
  customer_id: string;
  invoice_id: string;
  amount: number;
  method: 'cash' | 'gcash' | 'maya' | 'bank_transfer';
  reference_number: string | null;
  receiver: string | null;
  payment_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    account_number: string;
    full_name: string;
  };
  invoice?: {
    id: string;
    period_year: number;
    period_month: number;
    amount: number;
    status: string;
  };
}

export interface RecordPaymentPayload {
  customer_id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference_number?: string;
  payment_date: string;
  notes?: string;
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  customer_id?: string;
  method?: string;
  date_from?: string;
  date_to?: string;
}

export async function fetchPayments(params: PaymentListParams = {}): Promise<PaginatedResponse<IPayment>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.sort_by) query.sort_by = params.sort_by;
  if (params.sort_order) query.sort_order = params.sort_order;
  if (params.customer_id) query.customer_id = params.customer_id;
  if (params.method) query.method = params.method;
  if (params.date_from) query.date_from = params.date_from;
  if (params.date_to) query.date_to = params.date_to;

  const { data } = await api.get('/payments', { params: query });
  return data;
}

export async function fetchPayment(id: string): Promise<SingleResponse<IPayment>> {
  const { data } = await api.get(`/payments/${id}`);
  return data;
}

export async function recordPayment(payload: RecordPaymentPayload): Promise<SingleResponse<IPayment>> {
  const { data } = await api.post('/payments', payload);
  return data;
}

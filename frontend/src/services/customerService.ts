import api from './api';

export interface ICustomer {
  id: string;
  account_number: string;
  full_name: string;
  address: string;
  mobile_number: string;
  email: string | null;
  installation_address: string;
  service_area: string;
  plan_id: string;
  installation_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  plan?: {
    id: string;
    name: string;
    speed: string;
    monthly_fee: number;
    is_active: boolean;
  };
}

export interface CreateCustomerPayload {
  full_name: string;
  address: string;
  mobile_number: string;
  email?: string | null;
  installation_address: string;
  service_area: string;
  plan_id: string;
  installation_date: string;
}

export interface UpdateCustomerPayload {
  full_name?: string;
  address?: string;
  mobile_number?: string;
  email?: string | null;
  installation_address?: string;
  service_area?: string;
  plan_id?: string;
  installation_date?: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  status?: string;
  service_area?: string;
  plan_id?: string;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  success: true;
  data: T;
}

export async function fetchCustomers(params: CustomerListParams = {}): Promise<PaginatedResponse<ICustomer>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.sort_by) query.sort_by = params.sort_by;
  if (params.sort_order) query.sort_order = params.sort_order;
  if (params.status) query.status = params.status;
  if (params.service_area) query.service_area = params.service_area;
  if (params.plan_id) query.plan_id = params.plan_id;
  if (params.search) query.search = params.search;

  const { data } = await api.get('/customers', { params: query });
  return data;
}

export async function fetchCustomer(id: string): Promise<SingleResponse<ICustomer>> {
  const { data } = await api.get(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<SingleResponse<ICustomer>> {
  const { data } = await api.post('/customers', payload);
  return data;
}

export async function updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<SingleResponse<ICustomer>> {
  const { data } = await api.put(`/customers/${id}`, payload);
  return data;
}

export async function archiveCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function restoreCustomer(id: string): Promise<SingleResponse<ICustomer>> {
  const { data } = await api.post(`/customers/${id}/restore`);
  return data;
}

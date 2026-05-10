import api from './api';
import type { PaginatedResponse, SingleResponse } from './customerService';

export interface IInternetPlan {
  id: string;
  name: string;
  speed: string;
  monthly_fee: number;
  installation_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreatePlanPayload {
  name: string;
  speed: string;
  monthly_fee: number;
  installation_fee: number;
}

export interface UpdatePlanPayload {
  name?: string;
  speed?: string;
  monthly_fee?: number;
  installation_fee?: number;
}

export interface PlanListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export async function fetchPlans(params: PlanListParams = {}): Promise<PaginatedResponse<IInternetPlan>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.sort_by) query.sort_by = params.sort_by;
  if (params.sort_order) query.sort_order = params.sort_order;

  const { data } = await api.get('/plans', { params: query });
  return data;
}

export async function createPlan(payload: CreatePlanPayload): Promise<SingleResponse<IInternetPlan>> {
  const { data } = await api.post('/plans', payload);
  return data;
}

export async function updatePlan(id: string, payload: UpdatePlanPayload): Promise<SingleResponse<IInternetPlan>> {
  const { data } = await api.put(`/plans/${id}`, payload);
  return data;
}

export async function togglePlanStatus(id: string, is_active: boolean): Promise<SingleResponse<IInternetPlan>> {
  const { data } = await api.patch(`/plans/${id}/status`, { is_active });
  return data;
}

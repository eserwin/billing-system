import {
  store,
  MockPlan,
  generateId,
  paginate,
  matchesSearch,
} from '../store';
import { PaginationParams, PaginatedResult } from '../../types/common';
import { NotFoundError } from '../../middlewares/errorHandler';

export interface PlanFilters {
  is_active?: string;
  search?: string;
}

export function listPlans(
  filters: PlanFilters,
  pagination: PaginationParams
): PaginatedResult<MockPlan> {
  let results = store.plans.filter((p) => p.deleted_at === null);

  if (filters.is_active !== undefined) {
    const active = filters.is_active === 'true';
    results = results.filter((p) => p.is_active === active);
  }

  if (filters.search) {
    const term = filters.search;
    results = results.filter(
      (p) => matchesSearch(p.name, term) || matchesSearch(p.speed, term)
    );
  }

  // Sorting
  const sortBy = pagination.sort_by || 'created_at';
  const sortOrder = pagination.sort_order || 'DESC';
  results.sort((a, b) => {
    const aVal = (a as any)[sortBy] ?? '';
    const bVal = (b as any)[sortBy] ?? '';
    if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1;
    return 0;
  });

  return paginate(results, pagination);
}

export interface CreatePlanInput {
  name: string;
  speed: string;
  monthly_fee: number;
  installation_fee?: number;
}

export function createPlan(data: CreatePlanInput): MockPlan {
  const now = new Date().toISOString();

  const plan: MockPlan = {
    id: generateId(),
    name: data.name,
    speed: data.speed,
    monthly_fee: data.monthly_fee,
    installation_fee: data.installation_fee ?? 0,
    is_active: true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  store.plans.push(plan);
  return plan;
}

export interface UpdatePlanInput {
  name?: string;
  speed?: string;
  monthly_fee?: number;
  installation_fee?: number;
}

export function updatePlan(id: string, data: UpdatePlanInput): MockPlan {
  const index = store.plans.findIndex((p) => p.id === id && p.deleted_at === null);

  if (index === -1) {
    throw new NotFoundError('Internet plan not found');
  }

  const now = new Date().toISOString();
  const plan = store.plans[index];

  const updated: MockPlan = {
    ...plan,
    ...data,
    updated_at: now,
  };

  store.plans[index] = updated;
  return updated;
}

export function togglePlanStatus(id: string, isActive: boolean): MockPlan {
  const index = store.plans.findIndex((p) => p.id === id && p.deleted_at === null);

  if (index === -1) {
    throw new NotFoundError('Internet plan not found');
  }

  const now = new Date().toISOString();
  store.plans[index] = {
    ...store.plans[index],
    is_active: isActive,
    updated_at: now,
  };

  return store.plans[index];
}

export function findPlanById(id: string): MockPlan {
  const plan = store.plans.find((p) => p.id === id && p.deleted_at === null);

  if (!plan) {
    throw new NotFoundError('Internet plan not found');
  }

  return plan;
}

import {
  store,
  MockCustomer,
  generateId,
  generateAccountNumber,
  paginate,
  matchesSearch,
} from '../store';
import { PaginationParams, PaginatedResult, CustomerStatusEnum } from '../../types/common';
import { NotFoundError } from '../../middlewares/errorHandler';

export interface CustomerFilters {
  status?: string;
  service_area?: string;
  plan_id?: string;
  search?: string;
}

export interface CustomerWithPlan extends MockCustomer {
  plan?: {
    id: string;
    name: string;
    speed: string;
    monthly_fee: number;
    installation_fee: number;
    is_active: boolean;
  } | null;
}

function attachPlan(customer: MockCustomer): CustomerWithPlan {
  const plan = store.plans.find((p) => p.id === customer.plan_id) || null;
  return {
    ...customer,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          speed: plan.speed,
          monthly_fee: plan.monthly_fee,
          installation_fee: plan.installation_fee,
          is_active: plan.is_active,
        }
      : null,
  };
}

export function listCustomers(
  filters: CustomerFilters,
  pagination: PaginationParams
): PaginatedResult<CustomerWithPlan> {
  let results = store.customers.filter((c) => c.deleted_at === null);

  if (filters.status) {
    results = results.filter((c) => c.status === filters.status);
  }

  if (filters.service_area) {
    results = results.filter((c) => c.service_area === filters.service_area);
  }

  if (filters.plan_id) {
    results = results.filter((c) => c.plan_id === filters.plan_id);
  }

  if (filters.search) {
    const term = filters.search;
    results = results.filter(
      (c) =>
        matchesSearch(c.full_name, term) ||
        matchesSearch(c.account_number, term) ||
        matchesSearch(c.mobile_number, term) ||
        matchesSearch(c.email, term)
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

  const paginated = paginate(results, pagination);
  return {
    data: paginated.data.map(attachPlan),
    meta: paginated.meta,
  };
}

export interface CreateCustomerInput {
  full_name: string;
  address: string;
  mobile_number: string;
  email?: string | null;
  installation_address: string;
  service_area: string;
  plan_id: string;
  installation_date: string;
}

export function createCustomer(data: CreateCustomerInput): CustomerWithPlan {
  const now = new Date().toISOString();
  const account_number = generateAccountNumber(store.customers);

  const customer: MockCustomer = {
    id: generateId(),
    account_number,
    full_name: data.full_name,
    address: data.address,
    mobile_number: data.mobile_number,
    email: data.email ?? null,
    installation_address: data.installation_address,
    service_area: data.service_area,
    plan_id: data.plan_id,
    installation_date: data.installation_date,
    status: CustomerStatusEnum.ACTIVE,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  store.customers.push(customer);
  return attachPlan(customer);
}

export interface UpdateCustomerInput {
  full_name?: string;
  address?: string;
  mobile_number?: string;
  email?: string | null;
  installation_address?: string;
  service_area?: string;
  plan_id?: string;
  installation_date?: string;
}

export function updateCustomer(id: string, data: UpdateCustomerInput): CustomerWithPlan {
  const index = store.customers.findIndex((c) => c.id === id && c.deleted_at === null);

  if (index === -1) {
    throw new NotFoundError('Customer not found');
  }

  const now = new Date().toISOString();
  const customer = store.customers[index];

  const updated: MockCustomer = {
    ...customer,
    ...data,
    updated_at: now,
  };

  store.customers[index] = updated;
  return attachPlan(updated);
}

export function findCustomerById(id: string): CustomerWithPlan {
  const customer = store.customers.find((c) => c.id === id && c.deleted_at === null);

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return attachPlan(customer);
}

export function archiveCustomer(id: string): void {
  const index = store.customers.findIndex((c) => c.id === id && c.deleted_at === null);

  if (index === -1) {
    throw new NotFoundError('Customer not found');
  }

  const now = new Date().toISOString();
  store.customers[index] = {
    ...store.customers[index],
    deleted_at: now,
    updated_at: now,
  };
}

export function restoreCustomer(id: string): CustomerWithPlan {
  const index = store.customers.findIndex((c) => c.id === id);

  if (index === -1) {
    throw new NotFoundError('Customer not found');
  }

  if (!store.customers[index].deleted_at) {
    throw new NotFoundError('Customer is not archived');
  }

  const now = new Date().toISOString();
  store.customers[index] = {
    ...store.customers[index],
    deleted_at: null,
    updated_at: now,
  };

  return attachPlan(store.customers[index]);
}

import { v4 as uuidv4 } from 'uuid';
import {
  CustomerStatusEnum,
  InvoiceStatus,
  PaymentMethod,
  MikrotikAction,
  PaginationParams,
  PaginatedResult,
} from '../types/common';

// ─── Mock Entity Interfaces ───────────────────────────────────────────────────

export interface MockCustomer {
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
  status: CustomerStatusEnum;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MockPlan {
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

export interface MockInvoice {
  id: string;
  customer_id: string;
  plan_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  due_date: string;
  disconnected_days: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MockPayment {
  id: string;
  customer_id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference_number: string | null;
  receiver: string | null;
  payment_date: string;
  notes: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface MockMikrotikLog {
  id: string;
  customer_id: string;
  action: MikrotikAction;
  device_info: string | null;
  success: boolean;
  error_message: string | null;
  triggered_by: string | null;
  created_at: string;
}

export interface MockCustomerStatus {
  id: string;
  customer_id: string;
  previous_status: CustomerStatusEnum;
  new_status: CustomerStatusEnum;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
}

// ─── Mock Store ───────────────────────────────────────────────────────────────

export interface MockStore {
  customers: MockCustomer[];
  plans: MockPlan[];
  invoices: MockInvoice[];
  payments: MockPayment[];
  mikrotikLogs: MockMikrotikLog[];
  customerStatuses: MockCustomerStatus[];
}

export const store: MockStore = {
  customers: [],
  plans: [],
  invoices: [],
  payments: [],
  mikrotikLogs: [],
  customerStatuses: [],
};

// ─── Utility Functions ────────────────────────────────────────────────────────

export function generateId(): string {
  return uuidv4();
}

export function generateAccountNumber(existingCustomers: MockCustomer[]): string {
  const year = new Date().getFullYear();
  const existingForYear = existingCustomers.filter((c) =>
    c.account_number.startsWith(`ISP-${year}-`)
  );
  const maxSeq = existingForYear.reduce((max, c) => {
    const seq = parseInt(c.account_number.split('-')[2], 10);
    return isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `ISP-${year}-${nextSeq}`;
}

export function paginate<T>(items: T[], params: PaginationParams): PaginatedResult<T> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const data = items.slice(offset, offset + limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      total_pages: totalPages,
    },
  };
}

export function matchesSearch(value: string | null | undefined, term: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(term.toLowerCase());
}

import {
  store,
  MockInvoice,
  generateId,
  paginate,
} from '../store';
import {
  PaginationParams,
  PaginatedResult,
  InvoiceStatus,
  CustomerStatusEnum,
} from '../../types/common';
import { NotFoundError } from '../../middlewares/errorHandler';
import { calculateProratedAmount } from '../../utils/prorate';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface InvoiceFilters {
  status?: string;
  customer_id?: string;
  period_year?: string;
  period_month?: string;
}

export interface InvoiceWithAssociations extends MockInvoice {
  customer?: {
    id: string;
    account_number: string;
    full_name: string;
    mobile_number: string;
    email: string | null;
    status: CustomerStatusEnum;
  } | null;
  plan?: {
    id: string;
    name: string;
    speed: string;
    monthly_fee: number;
  } | null;
  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    payment_date: string;
    reference_number: string | null;
  }>;
}

export interface GenerationResult {
  generated: number;
  skipped: number;
  errors: string[];
}

export interface BillingSummary {
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
  by_status: {
    unpaid: number;
    paid: number;
    partial: number;
    overdue: number;
  };
}

export interface GenerateInvoicesInput {
  period_year: number;
  period_month: number;
  due_date: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function attachAssociations(invoice: MockInvoice): InvoiceWithAssociations {
  const customer = store.customers.find((c) => c.id === invoice.customer_id) || null;
  const plan = store.plans.find((p) => p.id === invoice.plan_id) || null;
  const payments = store.payments.filter((p) => p.invoice_id === invoice.id);

  return {
    ...invoice,
    customer: customer
      ? {
          id: customer.id,
          account_number: customer.account_number,
          full_name: customer.full_name,
          mobile_number: customer.mobile_number,
          email: customer.email,
          status: customer.status,
        }
      : null,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          speed: plan.speed,
          monthly_fee: plan.monthly_fee,
        }
      : null,
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      payment_date: p.payment_date,
      reference_number: p.reference_number,
    })),
  };
}

// ─── Service Functions ────────────────────────────────────────────────────────

export function listInvoices(
  filters: InvoiceFilters,
  pagination: PaginationParams
): PaginatedResult<InvoiceWithAssociations> {
  let results = store.invoices.filter((inv) => inv.deleted_at === null);

  if (filters.status) {
    results = results.filter((inv) => inv.status === filters.status);
  }

  if (filters.customer_id) {
    results = results.filter((inv) => inv.customer_id === filters.customer_id);
  }

  if (filters.period_year) {
    const year = parseInt(filters.period_year, 10);
    results = results.filter((inv) => inv.period_year === year);
  }

  if (filters.period_month) {
    const month = parseInt(filters.period_month, 10);
    results = results.filter((inv) => inv.period_month === month);
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
    data: paginated.data.map(attachAssociations),
    meta: paginated.meta,
  };
}

export function getInvoice(id: string): InvoiceWithAssociations {
  const invoice = store.invoices.find((inv) => inv.id === id && inv.deleted_at === null);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  return attachAssociations(invoice);
}

export function generateMonthlyInvoices(data: GenerateInvoicesInput): GenerationResult {
  const { period_year, period_month, due_date } = data;

  // Find active customers (exclude suspended)
  const activeCustomers = store.customers.filter(
    (c) => c.deleted_at === null && c.status !== CustomerStatusEnum.SUSPENDED
  );

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const customer of activeCustomers) {
    // Check if invoice already exists for this period
    const existing = store.invoices.find(
      (inv) =>
        inv.customer_id === customer.id &&
        inv.period_year === period_year &&
        inv.period_month === period_month &&
        inv.deleted_at === null
    );

    if (existing) {
      skipped++;
      continue;
    }

    const plan = store.plans.find((p) => p.id === customer.plan_id && p.deleted_at === null);
    if (!plan) {
      errors.push(`Customer ${customer.account_number}: no plan assigned`);
      skipped++;
      continue;
    }

    // Calculate amount (prorated if customer was disconnected)
    const disconnectedDays = customer.status === CustomerStatusEnum.DISCONNECTED ? 30 : 0;
    const amount = calculateProratedAmount(plan.monthly_fee, disconnectedDays);

    const now = new Date().toISOString();
    const invoice: MockInvoice = {
      id: generateId(),
      customer_id: customer.id,
      plan_id: plan.id,
      period_year,
      period_month,
      amount,
      paid_amount: 0,
      status: InvoiceStatus.UNPAID,
      due_date,
      disconnected_days: disconnectedDays,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    store.invoices.push(invoice);
    generated++;
  }

  return { generated, skipped, errors };
}

export function recalculateInvoiceStatus(invoiceId: string): MockInvoice {
  const index = store.invoices.findIndex((inv) => inv.id === invoiceId && inv.deleted_at === null);

  if (index === -1) {
    throw new NotFoundError('Invoice not found');
  }

  const invoice = store.invoices[index];

  // Sum all payments for this invoice
  const totalPaid = store.payments
    .filter((p) => p.invoice_id === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);

  let newStatus: InvoiceStatus;
  if (totalPaid >= invoice.amount) {
    newStatus = InvoiceStatus.PAID;
  } else if (totalPaid > 0) {
    newStatus = InvoiceStatus.PARTIAL;
  } else {
    // Keep overdue status if it was already overdue
    newStatus = invoice.status === InvoiceStatus.OVERDUE
      ? InvoiceStatus.OVERDUE
      : InvoiceStatus.UNPAID;
  }

  const now = new Date().toISOString();
  store.invoices[index] = {
    ...invoice,
    paid_amount: totalPaid,
    status: newStatus,
    updated_at: now,
  };

  return store.invoices[index];
}

export function getBillingSummary(periodYear?: number, periodMonth?: number): BillingSummary {
  let invoices = store.invoices.filter((inv) => inv.deleted_at === null);

  if (periodYear) {
    invoices = invoices.filter((inv) => inv.period_year === periodYear);
  }

  if (periodMonth) {
    invoices = invoices.filter((inv) => inv.period_month === periodMonth);
  }

  const summary: BillingSummary = {
    total_invoices: invoices.length,
    total_amount: 0,
    total_paid: 0,
    total_outstanding: 0,
    by_status: {
      unpaid: 0,
      paid: 0,
      partial: 0,
      overdue: 0,
    },
  };

  for (const invoice of invoices) {
    summary.total_amount += invoice.amount;
    summary.total_paid += invoice.paid_amount;
    summary.total_outstanding += (invoice.amount - invoice.paid_amount);
    summary.by_status[invoice.status as keyof typeof summary.by_status]++;
  }

  return summary;
}

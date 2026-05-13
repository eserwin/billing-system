import {
  store,
  MockPayment,
  generateId,
  paginate,
} from '../store';
import {
  PaginationParams,
  PaginatedResult,
  PaymentMethod,
  CustomerStatusEnum,
  MikrotikAction,
} from '../../types/common';
import { NotFoundError } from '../../middlewares/errorHandler';
import { recalculateInvoiceStatus } from './billingService';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PaymentFilters {
  customer_id?: string;
  invoice_id?: string;
  method?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaymentWithAssociations extends MockPayment {
  customer?: {
    id: string;
    account_number: string;
    full_name: string;
    mobile_number: string;
    email: string | null;
    status: CustomerStatusEnum;
  } | null;
  invoice?: {
    id: string;
    period_year: number;
    period_month: number;
    amount: number;
    paid_amount: number;
    status: string;
    due_date: string;
  } | null;
}

export interface RecordPaymentInput {
  customer_id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference_number?: string;
  payment_date: string;
  notes?: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function attachAssociations(payment: MockPayment): PaymentWithAssociations {
  const customer = store.customers.find((c) => c.id === payment.customer_id) || null;
  const invoice = store.invoices.find((inv) => inv.id === payment.invoice_id) || null;

  return {
    ...payment,
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
    invoice: invoice
      ? {
          id: invoice.id,
          period_year: invoice.period_year,
          period_month: invoice.period_month,
          amount: invoice.amount,
          paid_amount: invoice.paid_amount,
          status: invoice.status,
          due_date: invoice.due_date,
        }
      : null,
  };
}

// ─── Service Functions ────────────────────────────────────────────────────────

export function listPayments(
  filters: PaymentFilters,
  pagination: PaginationParams
): PaginatedResult<PaymentWithAssociations> {
  let results = [...store.payments];

  if (filters.customer_id) {
    results = results.filter((p) => p.customer_id === filters.customer_id);
  }

  if (filters.invoice_id) {
    results = results.filter((p) => p.invoice_id === filters.invoice_id);
  }

  if (filters.method) {
    results = results.filter((p) => p.method === filters.method);
  }

  if (filters.date_from) {
    results = results.filter((p) => p.payment_date >= filters.date_from!);
  }

  if (filters.date_to) {
    results = results.filter((p) => p.payment_date <= filters.date_to!);
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

export function recordPayment(data: RecordPaymentInput, recordedBy: string): PaymentWithAssociations {
  // Verify customer exists
  const customer = store.customers.find((c) => c.id === data.customer_id && c.deleted_at === null);
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Verify invoice exists and belongs to the customer
  const invoice = store.invoices.find((inv) => inv.id === data.invoice_id && inv.deleted_at === null);
  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }
  if (invoice.customer_id !== data.customer_id) {
    throw new NotFoundError('Invoice does not belong to the specified customer');
  }

  // Create payment record
  const now = new Date().toISOString();
  const payment: MockPayment = {
    id: generateId(),
    customer_id: data.customer_id,
    invoice_id: data.invoice_id,
    amount: data.amount,
    method: data.method,
    reference_number: data.reference_number || null,
    receiver: recordedBy,
    payment_date: data.payment_date,
    notes: data.notes || null,
    recorded_by: recordedBy,
    created_at: now,
    updated_at: now,
  };

  store.payments.push(payment);

  // Recalculate invoice status
  recalculateInvoiceStatus(data.invoice_id);

  // Auto-reconnect if customer is disconnected
  if (customer.status === CustomerStatusEnum.DISCONNECTED) {
    triggerReconnection(customer.id, recordedBy);
  }

  return attachAssociations(payment);
}

function triggerReconnection(customerId: string, triggeredBy: string): void {
  const index = store.customers.findIndex((c) => c.id === customerId);
  if (index === -1) return;

  const previousStatus = store.customers[index].status;
  const now = new Date().toISOString();

  // Update customer status to reconnected
  store.customers[index] = {
    ...store.customers[index],
    status: CustomerStatusEnum.RECONNECTED,
    updated_at: now,
  };

  // Log status change
  store.customerStatuses.push({
    id: generateId(),
    customer_id: customerId,
    previous_status: previousStatus,
    new_status: CustomerStatusEnum.RECONNECTED,
    reason: 'Payment received - automatic reconnection',
    changed_by: triggeredBy,
    created_at: now,
  });

  // Log MikroTik reconnection action
  store.mikrotikLogs.push({
    id: generateId(),
    customer_id: customerId,
    action: MikrotikAction.RECONNECT,
    device_info: null,
    success: true,
    error_message: null,
    triggered_by: triggeredBy,
    created_at: now,
  });
}

export function getPayment(id: string): PaymentWithAssociations {
  const payment = store.payments.find((p) => p.id === id);

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  return attachAssociations(payment);
}

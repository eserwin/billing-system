import { store } from '../store';
import { CustomerStatusEnum, InvoiceStatus, MikrotikAction } from '../../types/common';

// ─── Interfaces (mirror real reportService) ───────────────────────────────────

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
  created_at: Date;
}

export interface RecentDisconnection {
  id: string;
  customer_name: string;
  action: string;
  success: boolean;
  created_at: Date;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Get aggregated dashboard metrics from current store state.
 * Requirements: 6.1
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const activeCustomers = store.customers.filter(
    (c) => c.status === CustomerStatusEnum.ACTIVE && !c.deleted_at
  );
  const overdueCustomers = store.customers.filter(
    (c) => c.status === CustomerStatusEnum.OVERDUE && !c.deleted_at
  );
  const disconnectedCustomers = store.customers.filter(
    (c) => c.status === CustomerStatusEnum.DISCONNECTED && !c.deleted_at
  );

  // Find the most recent payment date to use as reference (handles seed data in the past)
  const sortedByDate = [...store.payments].sort(
    (a, b) => b.payment_date.localeCompare(a.payment_date)
  );
  const latestPaymentDate = sortedByDate.length > 0 ? sortedByDate[0].payment_date : new Date().toISOString().split('T')[0];
  const referenceMonth = latestPaymentDate.substring(0, 7) + '-01'; // YYYY-MM-01

  // Daily collections: sum of payments on the most recent payment date
  const dailyPayments = store.payments.filter((p) => p.payment_date === latestPaymentDate);
  const dailyCollections = dailyPayments.reduce((sum, p) => sum + p.amount, 0);

  // Monthly revenue: sum of payments in the same month as the latest payment
  const monthlyPayments = store.payments.filter(
    (p) => p.payment_date >= referenceMonth && p.payment_date <= latestPaymentDate
  );
  const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // Recent payments (last 10, sorted by created_at DESC)
  const sortedPayments = [...store.payments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const recent_payments: RecentPayment[] = sortedPayments.slice(0, 10).map((p) => {
    const customer = store.customers.find((c) => c.id === p.customer_id);
    return {
      id: p.id,
      customer_name: customer?.full_name || 'Unknown',
      amount: p.amount,
      method: p.method,
      payment_date: p.payment_date,
      created_at: new Date(p.created_at),
    };
  });

  // Recent disconnect/reconnect events (last 10)
  const disconnectReconnectLogs = store.mikrotikLogs
    .filter((log) => log.action === MikrotikAction.DISCONNECT || log.action === MikrotikAction.RECONNECT)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const recent_disconnections: RecentDisconnection[] = disconnectReconnectLogs.slice(0, 10).map((log) => {
    const customer = store.customers.find((c) => c.id === log.customer_id);
    return {
      id: log.id,
      customer_name: customer?.full_name || 'Unknown',
      action: log.action,
      success: log.success,
      created_at: new Date(log.created_at),
    };
  });

  return {
    total_active_customers: activeCustomers.length,
    total_overdue_customers: overdueCustomers.length,
    total_disconnected_customers: disconnectedCustomers.length,
    daily_collections: dailyCollections,
    monthly_revenue: monthlyRevenue,
    recent_payments,
    recent_disconnections,
  };
}

/**
 * Get collection report for a date range.
 * Requirements: 6.2
 */
export async function getCollectionReport(dateFrom: string, dateTo: string): Promise<CollectionReport> {
  const filteredPayments = store.payments.filter(
    (p) => p.payment_date >= dateFrom && p.payment_date <= dateTo
  );

  // Sort by payment_date DESC
  const sorted = [...filteredPayments].sort(
    (a, b) => b.payment_date.localeCompare(a.payment_date)
  );

  const items: CollectionPaymentItem[] = sorted.map((p) => {
    const customer = store.customers.find((c) => c.id === p.customer_id);
    return {
      id: p.id,
      customer_id: p.customer_id,
      customer_name: customer?.full_name || 'Unknown',
      account_number: customer?.account_number || 'N/A',
      amount: p.amount,
      method: p.method,
      reference_number: p.reference_number,
      payment_date: p.payment_date,
    };
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    payments: items,
    total_amount: totalAmount,
    total_count: filteredPayments.length,
    date_from: dateFrom,
    date_to: dateTo,
  };
}

/**
 * Get monthly income report for a given year.
 * Requirements: 6.3
 */
export async function getMonthlyIncomeReport(year: number): Promise<MonthlyIncomeReport> {
  const months: MonthlyIncomeItem[] = [];
  let totalAnnual = 0;

  for (let month = 1; month <= 12; month++) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    // Calculate end of month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const monthPayments = store.payments.filter(
      (p) => p.payment_date >= startDate && p.payment_date <= endDate
    );

    const totalPayments = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    totalAnnual += totalPayments;

    months.push({
      month,
      month_name: MONTH_NAMES[month - 1],
      total_payments: totalPayments,
      payment_count: monthPayments.length,
    });
  }

  return {
    year,
    months,
    total_annual: totalAnnual,
  };
}

/**
 * Get overdue accounts report.
 * Requirements: 6.4
 */
export async function getOverdueReport(): Promise<OverdueReport> {
  const overdueInvoices = store.invoices.filter(
    (inv) => inv.status === InvoiceStatus.OVERDUE && !inv.deleted_at
  );

  // Group by customer
  const customerMap = new Map<string, {
    customer_id: string;
    customer_name: string;
    account_number: string;
    plan_name: string;
    outstanding_amount: number;
    overdue_invoices: number;
    oldest_due_date: string;
  }>();

  for (const invoice of overdueInvoices) {
    const customer = store.customers.find((c) => c.id === invoice.customer_id);
    if (!customer) continue;

    const outstanding = invoice.amount - invoice.paid_amount;
    const existing = customerMap.get(invoice.customer_id);

    if (existing) {
      existing.outstanding_amount += outstanding;
      existing.overdue_invoices += 1;
      if (invoice.due_date < existing.oldest_due_date) {
        existing.oldest_due_date = invoice.due_date;
      }
    } else {
      const plan = store.plans.find((p) => p.id === customer.plan_id);
      customerMap.set(invoice.customer_id, {
        customer_id: invoice.customer_id,
        customer_name: customer.full_name,
        account_number: customer.account_number,
        plan_name: plan?.name || 'N/A',
        outstanding_amount: outstanding,
        overdue_invoices: 1,
        oldest_due_date: invoice.due_date,
      });
    }
  }

  const customers = Array.from(customerMap.values());
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_amount, 0);

  return {
    customers,
    total_outstanding: totalOutstanding,
    total_count: customers.length,
  };
}

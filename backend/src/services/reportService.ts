import { Op, fn, col, literal } from 'sequelize';
import Customer from '../models/Customer';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import MikrotikLog from '../models/MikrotikLog';
import InternetPlan from '../models/InternetPlan';
import { CustomerStatusEnum, InvoiceStatus, MikrotikAction } from '../types/common';
import { dayjs } from '../utils/date';

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


const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Get aggregated dashboard metrics.
 * Requirements: 8.1, 8.5
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = dayjs.utc().format('YYYY-MM-DD');
  const startOfMonth = dayjs.utc().startOf('month').format('YYYY-MM-DD');

  // Count customers by status
  const [totalActive, totalOverdue, totalDisconnected] = await Promise.all([
    Customer.count({ where: { status: CustomerStatusEnum.ACTIVE } }),
    Customer.count({ where: { status: CustomerStatusEnum.OVERDUE } }),
    Customer.count({ where: { status: CustomerStatusEnum.DISCONNECTED } }),
  ]);

  // Daily collections: sum of payments recorded today
  const dailyPayments = await Payment.findAll({
    where: { payment_date: today },
  });
  const dailyCollections = dailyPayments.reduce((sum, p) => sum + p.amount, 0);

  // Monthly revenue: sum of payments this month
  const monthlyPayments = await Payment.findAll({
    where: {
      payment_date: {
        [Op.gte]: startOfMonth,
        [Op.lte]: today,
      },
    },
  });
  const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // Recent payments (last 10)
  const recentPaymentsRaw = await Payment.findAll({
    include: [{ model: Customer, as: 'customer' }],
    order: [['created_at', 'DESC']],
    limit: 10,
  });

  const recent_payments: RecentPayment[] = recentPaymentsRaw.map((p) => ({
    id: p.id,
    customer_name: (p as any).customer?.full_name || 'Unknown',
    amount: p.amount,
    method: p.method,
    payment_date: p.payment_date,
    created_at: p.created_at,
  }));

  // Recent disconnect/reconnect events (last 10)
  const recentMikrotikLogs = await MikrotikLog.findAll({
    where: { action: { [Op.in]: [MikrotikAction.DISCONNECT, MikrotikAction.RECONNECT] } },
    include: [{ model: Customer, as: 'customer' }],
    order: [['created_at', 'DESC']],
    limit: 10,
  });

  const recent_disconnections: RecentDisconnection[] = recentMikrotikLogs.map((log) => ({
    id: log.id,
    customer_name: (log as any).customer?.full_name || 'Unknown',
    action: log.action,
    success: log.success,
    created_at: log.created_at,
  }));

  return {
    total_active_customers: totalActive,
    total_overdue_customers: totalOverdue,
    total_disconnected_customers: totalDisconnected,
    daily_collections: dailyCollections,
    monthly_revenue: monthlyRevenue,
    recent_payments,
    recent_disconnections,
  };
}

/**
 * Get collection report for a date range.
 * Requirements: 8.2
 */
export async function getCollectionReport(dateFrom: string, dateTo: string): Promise<CollectionReport> {
  const payments = await Payment.findAll({
    where: {
      payment_date: {
        [Op.gte]: dateFrom,
        [Op.lte]: dateTo,
      },
    },
    include: [{ model: Customer, as: 'customer' }],
    order: [['payment_date', 'DESC']],
  });

  const items: CollectionPaymentItem[] = payments.map((p) => ({
    id: p.id,
    customer_id: p.customer_id,
    customer_name: (p as any).customer?.full_name || 'Unknown',
    account_number: (p as any).customer?.account_number || 'N/A',
    amount: p.amount,
    method: p.method,
    reference_number: p.reference_number,
    payment_date: p.payment_date,
  }));

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    payments: items,
    total_amount: totalAmount,
    total_count: payments.length,
    date_from: dateFrom,
    date_to: dateTo,
  };
}

/**
 * Get monthly income report for a given year.
 * Requirements: 8.3
 */
export async function getMonthlyIncomeReport(year: number): Promise<MonthlyIncomeReport> {
  const months: MonthlyIncomeItem[] = [];
  let totalAnnual = 0;

  for (let month = 1; month <= 12; month++) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');

    const payments = await Payment.findAll({
      where: {
        payment_date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
    });

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    totalAnnual += totalPayments;

    months.push({
      month,
      month_name: MONTH_NAMES[month - 1],
      total_payments: totalPayments,
      payment_count: payments.length,
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
 * Requirements: 8.4
 */
export async function getOverdueReport(): Promise<OverdueReport> {
  // Find all overdue invoices grouped by customer
  const overdueInvoices = await Invoice.findAll({
    where: { status: InvoiceStatus.OVERDUE },
    include: [
      {
        model: Customer,
        as: 'customer',
        include: [{ model: InternetPlan, as: 'plan' }],
      },
    ],
    order: [['due_date', 'ASC']],
  });

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
    const customer = (invoice as any).customer;
    if (!customer) continue;

    const existing = customerMap.get(invoice.customer_id);
    const outstanding = invoice.amount - invoice.paid_amount;

    if (existing) {
      existing.outstanding_amount += outstanding;
      existing.overdue_invoices += 1;
      if (invoice.due_date < existing.oldest_due_date) {
        existing.oldest_due_date = invoice.due_date;
      }
    } else {
      customerMap.set(invoice.customer_id, {
        customer_id: invoice.customer_id,
        customer_name: customer.full_name,
        account_number: customer.account_number,
        plan_name: customer.plan?.name || 'N/A',
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

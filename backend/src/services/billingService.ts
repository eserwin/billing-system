import { Op, WhereOptions } from 'sequelize';
import Invoice from '../models/Invoice';
import Customer from '../models/Customer';
import InternetPlan from '../models/InternetPlan';
import Payment from '../models/Payment';
import { PaginationParams, PaginatedResult, InvoiceStatus, CustomerStatusEnum } from '../types/common';
import { buildPaginatedResult, getOffset } from '../utils/pagination';
import { calculateProratedAmount } from '../utils/prorate';
import { NotFoundError, ConflictError } from '../middlewares/errorHandler';
import { GenerateInvoicesDTO } from '../validators/billingSchema';

export interface InvoiceFilters {
  status?: string;
  customer_id?: string;
  period_year?: string;
  period_month?: string;
  search?: string;
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

export async function generateMonthlyInvoices(data: GenerateInvoicesDTO): Promise<GenerationResult> {
  const { period_year, period_month, due_date } = data;

  // Find all active customers with their plans
  const customers = await Customer.findAll({
    where: { status: { [Op.ne]: CustomerStatusEnum.SUSPENDED } },
    include: [{ model: InternetPlan, as: 'plan' }],
  });

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const customer of customers) {
    try {
      // Check if invoice already exists for this period
      const existing = await Invoice.findOne({
        where: {
          customer_id: customer.id,
          period_year,
          period_month,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const plan = (customer as any).plan as InternetPlan;
      if (!plan) {
        errors.push(`Customer ${customer.account_number}: no plan assigned`);
        skipped++;
        continue;
      }

      // Calculate amount (prorated if customer was disconnected)
      const disconnectedDays = customer.status === CustomerStatusEnum.DISCONNECTED ? 30 : 0;
      const amount = calculateProratedAmount(plan.monthly_fee, disconnectedDays);

      await Invoice.create({
        customer_id: customer.id,
        plan_id: plan.id,
        period_year,
        period_month,
        amount,
        paid_amount: 0,
        status: InvoiceStatus.UNPAID,
        due_date,
        disconnected_days: disconnectedDays,
      });

      generated++;
    } catch (err: any) {
      errors.push(`Customer ${customer.account_number}: ${err.message}`);
    }
  }

  return { generated, skipped, errors };
}


export async function getInvoice(id: string): Promise<Invoice> {
  const invoice = await Invoice.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: InternetPlan, as: 'plan' },
      { model: Payment, as: 'payments' },
    ],
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  return invoice;
}

export async function listInvoices(
  filters: InvoiceFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<Invoice>> {
  const where: WhereOptions = {};

  if (filters.status) {
    (where as any).status = filters.status;
  }

  if (filters.customer_id) {
    (where as any).customer_id = filters.customer_id;
  }

  if (filters.period_year) {
    (where as any).period_year = parseInt(filters.period_year, 10);
  }

  if (filters.period_month) {
    (where as any).period_month = parseInt(filters.period_month, 10);
  }

  const offset = getOffset(pagination);

  const { rows, count } = await Invoice.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer' },
      { model: InternetPlan, as: 'plan' },
    ],
    order: [[pagination.sort_by || 'created_at', pagination.sort_order || 'DESC']],
    limit: pagination.limit,
    offset,
  });

  return buildPaginatedResult(rows, count, pagination);
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
  const invoice = await Invoice.findByPk(id);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  await invoice.update({ status });

  return invoice.reload({
    include: [
      { model: Customer, as: 'customer' },
      { model: InternetPlan, as: 'plan' },
    ],
  });
}

/**
 * Recalculate and update invoice status based on total payments.
 * - If paid_amount >= amount → Paid
 * - If paid_amount > 0 but < amount → Partial
 * - If paid_amount === 0 → Unpaid (or Overdue if already overdue)
 */
export async function recalculateInvoiceStatus(invoiceId: string): Promise<Invoice> {
  const invoice = await Invoice.findByPk(invoiceId);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  // Sum all payments for this invoice
  const payments = await Payment.findAll({
    where: { invoice_id: invoiceId },
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

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

  await invoice.update({ paid_amount: totalPaid, status: newStatus });

  return invoice.reload();
}

export async function getBillingSummary(periodYear?: number, periodMonth?: number): Promise<BillingSummary> {
  const where: WhereOptions = {};

  if (periodYear) {
    (where as any).period_year = periodYear;
  }

  if (periodMonth) {
    (where as any).period_month = periodMonth;
  }

  const invoices = await Invoice.findAll({ where });

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

export async function exportPdf(id: string): Promise<Buffer> {
  const invoice = await getInvoice(id);

  // Generate a simple PDF representation
  // In production, this would use pdfkit or puppeteer-core
  const content = [
    `INVOICE`,
    `========================================`,
    `Invoice ID: ${invoice.id}`,
    `Customer: ${(invoice as any).customer?.full_name || 'N/A'}`,
    `Account: ${(invoice as any).customer?.account_number || 'N/A'}`,
    `Plan: ${(invoice as any).plan?.name || 'N/A'}`,
    `Period: ${invoice.period_month}/${invoice.period_year}`,
    `Due Date: ${invoice.due_date}`,
    `Amount: ${invoice.amount}`,
    `Paid: ${invoice.paid_amount}`,
    `Status: ${invoice.status}`,
    `========================================`,
  ].join('\n');

  return Buffer.from(content, 'utf-8');
}

import { Op, WhereOptions } from 'sequelize';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import Customer from '../models/Customer';
import CustomerStatus from '../models/CustomerStatus';
import MikrotikLog from '../models/MikrotikLog';
import SystemSetting from '../models/SystemSetting';
import { PaginationParams, PaginatedResult, CustomerStatusEnum, MikrotikAction } from '../types/common';
import { buildPaginatedResult, getOffset } from '../utils/pagination';
import { recalculateInvoiceStatus } from './billingService';
import { NotFoundError } from '../middlewares/errorHandler';
import { RecordPaymentDTO } from '../validators/paymentSchema';

export interface PaymentFilters {
  customer_id?: string;
  invoice_id?: string;
  method?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

/**
 * Check if MikroTik integration is enabled via system settings.
 */
async function isMikrotikEnabled(): Promise<boolean> {
  const setting = await SystemSetting.findOne({
    where: { key: 'mikrotik_enabled' },
  });
  return setting?.value === 'true';
}

/**
 * Record a payment, update invoice status, and trigger reconnection if applicable.
 */
export async function recordPayment(data: RecordPaymentDTO, recordedBy: string): Promise<Payment> {
  // Verify customer exists
  const customer = await Customer.findByPk(data.customer_id);
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Verify invoice exists and belongs to the customer
  const invoice = await Invoice.findByPk(data.invoice_id);
  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }
  if (invoice.customer_id !== data.customer_id) {
    throw new NotFoundError('Invoice does not belong to the specified customer');
  }

  // Create payment record
  const payment = await Payment.create({
    customer_id: data.customer_id,
    invoice_id: data.invoice_id,
    amount: data.amount,
    method: data.method,
    reference_number: data.reference_number || null,
    payment_date: data.payment_date,
    notes: data.notes || null,
    recorded_by: recordedBy,
  });

  // Recalculate invoice status based on total payments
  await recalculateInvoiceStatus(data.invoice_id);

  // Trigger reconnection if customer is disconnected
  if (customer.status === CustomerStatusEnum.DISCONNECTED) {
    await triggerReconnection(customer, recordedBy);
  }

  return payment.reload({
    include: [
      { model: Customer, as: 'customer' },
      { model: Invoice, as: 'invoice' },
    ],
  });
}

/**
 * Trigger reconnection process for a disconnected customer.
 * If MikroTik is enabled, log the reconnect action.
 * Update customer status to RECONNECTED.
 */
async function triggerReconnection(customer: Customer, triggeredBy: string): Promise<void> {
  const previousStatus = customer.status;
  const mikrotikEnabled = await isMikrotikEnabled();

  if (mikrotikEnabled) {
    // Log MikroTik reconnection action
    await MikrotikLog.create({
      customer_id: customer.id,
      action: MikrotikAction.RECONNECT,
      success: true,
      triggered_by: triggeredBy,
    });
  }

  // Update customer status to RECONNECTED
  await customer.update({ status: CustomerStatusEnum.RECONNECTED });

  // Log status change
  await CustomerStatus.create({
    customer_id: customer.id,
    previous_status: previousStatus,
    new_status: CustomerStatusEnum.RECONNECTED,
    reason: 'Payment received - automatic reconnection',
    changed_by: triggeredBy,
  });
}

export async function getPayment(id: string): Promise<Payment> {
  const payment = await Payment.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Invoice, as: 'invoice' },
    ],
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  return payment;
}

export async function listPayments(
  filters: PaymentFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<Payment>> {
  const where: WhereOptions = {};

  if (filters.customer_id) {
    (where as any).customer_id = filters.customer_id;
  }

  if (filters.invoice_id) {
    (where as any).invoice_id = filters.invoice_id;
  }

  if (filters.method) {
    (where as any).method = filters.method;
  }

  if (filters.date_from && filters.date_to) {
    (where as any).payment_date = {
      [Op.between]: [filters.date_from, filters.date_to],
    };
  } else if (filters.date_from) {
    (where as any).payment_date = {
      [Op.gte]: filters.date_from,
    };
  } else if (filters.date_to) {
    (where as any).payment_date = {
      [Op.lte]: filters.date_to,
    };
  }

  const offset = getOffset(pagination);

  const { rows, count } = await Payment.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer' },
      { model: Invoice, as: 'invoice' },
    ],
    order: [[pagination.sort_by || 'created_at', pagination.sort_order || 'DESC']],
    limit: pagination.limit,
    offset,
  });

  return buildPaginatedResult(rows, count, pagination);
}

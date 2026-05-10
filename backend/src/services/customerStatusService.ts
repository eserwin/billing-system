import { Op } from 'sequelize';
import Customer from '../models/Customer';
import Invoice from '../models/Invoice';
import CustomerStatus from '../models/CustomerStatus';
import AuditLog from '../models/AuditLog';
import { CustomerStatusEnum, InvoiceStatus } from '../types/common';
import { dayjs } from '../utils/date';

export interface StatusCheckResult {
  due_soon_updated: number;
  overdue_updated: number;
  errors: string[];
}

/**
 * Update a customer's status and log the change.
 */
export async function updateStatus(
  customerId: string,
  newStatus: CustomerStatusEnum,
  reason: string,
  changedBy?: string
): Promise<Customer> {
  const customer = await Customer.findByPk(customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const previousStatus = customer.status;

  // Skip if status is already the same
  if (previousStatus === newStatus) {
    return customer;
  }

  // Update customer status
  await customer.update({ status: newStatus });

  // Log the status change
  await logStatusChange(customerId, previousStatus, newStatus, reason, changedBy);

  return customer.reload();
}

/**
 * Log a status change in the customer_statuses table and audit_logs table.
 */
export async function logStatusChange(
  customerId: string,
  previousStatus: CustomerStatusEnum,
  newStatus: CustomerStatusEnum,
  reason: string,
  changedBy?: string
): Promise<void> {
  // Create status history entry
  await CustomerStatus.create({
    customer_id: customerId,
    previous_status: previousStatus,
    new_status: newStatus,
    reason,
    changed_by: changedBy || null,
  });

  // Create audit log entry
  await AuditLog.create({
    user_id: changedBy || null,
    action: 'STATUS_CHANGE',
    target_type: 'Customer',
    target_id: customerId,
    previous_values: { status: previousStatus },
    new_values: { status: newStatus },
  });
}

/**
 * Check all active customers for invoices due within 3 days
 * and update their status to DUE_SOON.
 */
export async function checkDueSoon(): Promise<number> {
  const today = dayjs.utc();
  const threeDaysFromNow = today.add(3, 'day').format('YYYY-MM-DD');
  const todayStr = today.format('YYYY-MM-DD');

  // Find customers with unpaid invoices due within 3 days
  const customers = await Customer.findAll({
    where: {
      status: CustomerStatusEnum.ACTIVE,
    },
    include: [
      {
        model: Invoice,
        as: 'invoices',
        where: {
          status: { [Op.in]: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
          due_date: { [Op.between]: [todayStr, threeDaysFromNow] },
        },
        required: true,
      },
    ],
  });

  let updated = 0;

  for (const customer of customers) {
    await updateStatus(
      customer.id,
      CustomerStatusEnum.DUE_SOON,
      'Invoice due within 3 days',
    );
    updated++;
  }

  return updated;
}

/**
 * Check all customers for overdue invoices (past due date without full payment)
 * and update their status to OVERDUE.
 */
export async function checkOverdue(): Promise<number> {
  const today = dayjs.utc().format('YYYY-MM-DD');

  // Find customers with unpaid/partial invoices past due date
  // Only check customers that are ACTIVE or DUE_SOON (not already OVERDUE/DISCONNECTED)
  const customers = await Customer.findAll({
    where: {
      status: { [Op.in]: [CustomerStatusEnum.ACTIVE, CustomerStatusEnum.DUE_SOON] },
    },
    include: [
      {
        model: Invoice,
        as: 'invoices',
        where: {
          status: { [Op.in]: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
          due_date: { [Op.lt]: today },
        },
        required: true,
      },
    ],
  });

  let updated = 0;

  for (const customer of customers) {
    await updateStatus(
      customer.id,
      CustomerStatusEnum.OVERDUE,
      'Invoice past due date without full payment',
    );

    // Also mark the overdue invoices
    const overdueInvoices = (customer as any).invoices as Invoice[];
    for (const invoice of overdueInvoices) {
      if (invoice.status !== InvoiceStatus.OVERDUE) {
        await invoice.update({ status: InvoiceStatus.OVERDUE });
      }
    }

    updated++;
  }

  return updated;
}

/**
 * Run all daily status checks.
 * This is the main entry point for the EventBridge-triggered handler.
 */
export async function runDailyStatusChecks(): Promise<StatusCheckResult> {
  const errors: string[] = [];
  let dueSoonUpdated = 0;
  let overdueUpdated = 0;

  try {
    dueSoonUpdated = await checkDueSoon();
  } catch (err: any) {
    errors.push(`checkDueSoon failed: ${err.message}`);
  }

  try {
    overdueUpdated = await checkOverdue();
  } catch (err: any) {
    errors.push(`checkOverdue failed: ${err.message}`);
  }

  return {
    due_soon_updated: dueSoonUpdated,
    overdue_updated: overdueUpdated,
    errors,
  };
}

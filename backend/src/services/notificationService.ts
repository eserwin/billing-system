import { Op } from 'sequelize';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import Customer from '../models/Customer';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Notification from '../models/Notification';
import {
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  InvoiceStatus,
  PaginationParams,
  PaginatedResult,
} from '../types/common';
import { formatCurrency } from '../utils/currency';
import { formatDateManila, dayjs } from '../utils/date';
import { buildPaginatedResult, getOffset } from '../utils/pagination';

// --- AWS SES Client ---
const sesClient = new SESClient({ region: process.env.COGNITO_REGION || 'ap-southeast-1' });
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@ispbilling.com';

// --- Semaphore SMS API ---
const SEMAPHORE_API_URL = 'https://api.semaphore.co/api/v4/messages';
const SEMAPHORE_API_KEY = process.env.SMS_API_KEY || '';
const SEMAPHORE_SENDER_NAME = process.env.SMS_SENDER_NAME || 'ISPBill';

export interface NotificationResult {
  success: boolean;
  notification_id: string;
  channel: NotificationChannel;
  error?: string;
}

export interface NotificationFilters {
  customer_id?: string;
  channel?: NotificationChannel;
  type?: NotificationType;
  status?: NotificationStatus;
  date_from?: string;
  date_to?: string;
}


// --- Message Templates ---

function buildDueReminderMessage(customerName: string, amount: number, dueDate: string): string {
  return `Hi ${customerName}, your internet bill of ${formatCurrency(amount)} is due on ${dueDate}. Please settle your payment to avoid service interruption.`;
}

function buildOverdueNoticeMessage(customerName: string, amount: number, dueDate: string): string {
  return `Hi ${customerName}, your internet bill of ${formatCurrency(amount)} was due on ${dueDate} and is now overdue. Please pay immediately to avoid disconnection.`;
}

function buildPaymentConfirmationMessage(customerName: string, amount: number, referenceNumber?: string): string {
  const refPart = referenceNumber ? ` Ref: ${referenceNumber}.` : '';
  return `Hi ${customerName}, we received your payment of ${formatCurrency(amount)}.${refPart} Thank you!`;
}

function buildDisconnectWarningMessage(customerName: string, dueDate: string): string {
  return `Hi ${customerName}, your account is scheduled for disconnection due to unpaid balance. Please settle your bill immediately to avoid service interruption.`;
}

function buildReconnectConfirmationMessage(customerName: string): string {
  return `Hi ${customerName}, your internet service has been reconnected. Thank you for your payment!`;
}

// --- Email HTML Templates ---

function buildEmailHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="color: #333;">${subject}</h2>
  <p style="font-size: 14px; color: #555;">${body}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
  <p style="font-size: 12px; color: #999;">ISP Billing System</p>
</body>
</html>`;
}


// --- Core Send Functions ---

/**
 * Send an email via AWS SES.
 */
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const command = new SendEmailCommand({
    Source: SES_FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: buildEmailHtml(subject, body), Charset: 'UTF-8' },
        Text: { Data: body, Charset: 'UTF-8' },
      },
    },
  });

  await sesClient.send(command);
}

/**
 * Send an SMS via Semaphore API.
 */
async function sendSms(to: string, message: string): Promise<void> {
  const response = await fetch(SEMAPHORE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: SEMAPHORE_API_KEY,
      number: to,
      message,
      sendername: SEMAPHORE_SENDER_NAME,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Semaphore API error: ${response.status} - ${errorText}`);
  }
}

/**
 * Send a notification via the specified channel and log it to the database.
 */
async function sendNotification(
  customerId: string,
  channel: NotificationChannel,
  type: NotificationType,
  recipient: string,
  message: string,
  subject?: string
): Promise<NotificationResult> {
  // Create the notification log entry first (pending)
  const notification = await Notification.create({
    customer_id: customerId,
    channel,
    type,
    recipient,
    message,
    status: NotificationStatus.PENDING,
  });

  try {
    if (channel === NotificationChannel.EMAIL) {
      await sendEmail(recipient, subject || 'ISP Billing Notification', message);
    } else {
      await sendSms(recipient, message);
    }

    // Mark as sent
    await notification.update({
      status: NotificationStatus.SENT,
      sent_at: new Date(),
    });

    return {
      success: true,
      notification_id: notification.id,
      channel,
    };
  } catch (err: any) {
    // Mark as failed and log error
    await notification.update({
      status: NotificationStatus.FAILED,
      error_message: err.message || 'Unknown error',
    });

    return {
      success: false,
      notification_id: notification.id,
      channel,
      error: err.message || 'Unknown error',
    };
  }
}


// --- Public Service Functions ---

/**
 * Send a due date reminder to a customer (3 days before due date).
 * Sends via both SMS and email if available.
 * Requirements: 6.1
 */
export async function sendDueReminder(customerId: string): Promise<NotificationResult[]> {
  const customer = await Customer.findByPk(customerId, {
    include: [
      {
        model: Invoice,
        as: 'invoices',
        where: {
          status: { [Op.in]: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
        },
        required: false,
        limit: 1,
        order: [['due_date', 'ASC']],
      },
    ],
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const invoices = (customer as any).invoices as Invoice[];
  const invoice = invoices?.[0];

  if (!invoice) {
    throw new Error(`No unpaid invoice found for customer: ${customerId}`);
  }

  const message = buildDueReminderMessage(
    customer.full_name,
    invoice.amount,
    formatDateManila(invoice.due_date, 'MMMM D, YYYY')
  );

  const results: NotificationResult[] = [];

  // Send SMS
  if (customer.mobile_number) {
    const smsResult = await sendNotification(
      customerId,
      NotificationChannel.SMS,
      NotificationType.DUE_REMINDER,
      customer.mobile_number,
      message
    );
    results.push(smsResult);
  }

  // Send email
  if (customer.email) {
    const emailResult = await sendNotification(
      customerId,
      NotificationChannel.EMAIL,
      NotificationType.DUE_REMINDER,
      customer.email,
      message,
      'Payment Due Reminder'
    );
    results.push(emailResult);
  }

  return results;
}

/**
 * Send an overdue notice to a customer.
 * Requirements: 6.2
 */
export async function sendOverdueNotice(customerId: string): Promise<NotificationResult[]> {
  const customer = await Customer.findByPk(customerId, {
    include: [
      {
        model: Invoice,
        as: 'invoices',
        where: {
          status: { [Op.in]: [InvoiceStatus.OVERDUE, InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
        },
        required: false,
        limit: 1,
        order: [['due_date', 'ASC']],
      },
    ],
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const invoices = (customer as any).invoices as Invoice[];
  const invoice = invoices?.[0];

  if (!invoice) {
    throw new Error(`No overdue invoice found for customer: ${customerId}`);
  }

  const message = buildOverdueNoticeMessage(
    customer.full_name,
    invoice.amount - invoice.paid_amount,
    formatDateManila(invoice.due_date, 'MMMM D, YYYY')
  );

  const results: NotificationResult[] = [];

  if (customer.mobile_number) {
    const smsResult = await sendNotification(
      customerId,
      NotificationChannel.SMS,
      NotificationType.OVERDUE_NOTICE,
      customer.mobile_number,
      message
    );
    results.push(smsResult);
  }

  if (customer.email) {
    const emailResult = await sendNotification(
      customerId,
      NotificationChannel.EMAIL,
      NotificationType.OVERDUE_NOTICE,
      customer.email,
      message,
      'Overdue Payment Notice'
    );
    results.push(emailResult);
  }

  return results;
}


/**
 * Send a payment confirmation to a customer.
 * Requirements: 6.3
 */
export async function sendPaymentConfirmation(paymentId: string): Promise<NotificationResult[]> {
  const payment = await Payment.findByPk(paymentId, {
    include: [
      { model: Customer, as: 'customer' },
    ],
  });

  if (!payment) {
    throw new Error(`Payment not found: ${paymentId}`);
  }

  const customer = (payment as any).customer as Customer;

  if (!customer) {
    throw new Error(`Customer not found for payment: ${paymentId}`);
  }

  const message = buildPaymentConfirmationMessage(
    customer.full_name,
    payment.amount,
    payment.reference_number || undefined
  );

  const results: NotificationResult[] = [];

  if (customer.mobile_number) {
    const smsResult = await sendNotification(
      customer.id,
      NotificationChannel.SMS,
      NotificationType.PAYMENT_CONFIRMATION,
      customer.mobile_number,
      message
    );
    results.push(smsResult);
  }

  if (customer.email) {
    const emailResult = await sendNotification(
      customer.id,
      NotificationChannel.EMAIL,
      NotificationType.PAYMENT_CONFIRMATION,
      customer.email,
      message,
      'Payment Confirmation'
    );
    results.push(emailResult);
  }

  return results;
}

/**
 * Send a disconnection warning to a customer (1 day before disconnect).
 * Requirements: 6.4
 */
export async function sendDisconnectWarning(customerId: string): Promise<NotificationResult[]> {
  const customer = await Customer.findByPk(customerId, {
    include: [
      {
        model: Invoice,
        as: 'invoices',
        where: {
          status: { [Op.in]: [InvoiceStatus.OVERDUE, InvoiceStatus.UNPAID] },
        },
        required: false,
        limit: 1,
        order: [['due_date', 'ASC']],
      },
    ],
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const invoices = (customer as any).invoices as Invoice[];
  const invoice = invoices?.[0];
  const dueDate = invoice ? formatDateManila(invoice.due_date, 'MMMM D, YYYY') : 'N/A';

  const message = buildDisconnectWarningMessage(customer.full_name, dueDate);

  const results: NotificationResult[] = [];

  if (customer.mobile_number) {
    const smsResult = await sendNotification(
      customerId,
      NotificationChannel.SMS,
      NotificationType.DISCONNECT_WARNING,
      customer.mobile_number,
      message
    );
    results.push(smsResult);
  }

  if (customer.email) {
    const emailResult = await sendNotification(
      customerId,
      NotificationChannel.EMAIL,
      NotificationType.DISCONNECT_WARNING,
      customer.email,
      message,
      'Disconnection Warning'
    );
    results.push(emailResult);
  }

  return results;
}

/**
 * Send a reconnection confirmation to a customer.
 * Requirements: 6.5
 */
export async function sendReconnectConfirmation(customerId: string): Promise<NotificationResult[]> {
  const customer = await Customer.findByPk(customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const message = buildReconnectConfirmationMessage(customer.full_name);

  const results: NotificationResult[] = [];

  if (customer.mobile_number) {
    const smsResult = await sendNotification(
      customerId,
      NotificationChannel.SMS,
      NotificationType.RECONNECT_CONFIRMATION,
      customer.mobile_number,
      message
    );
    results.push(smsResult);
  }

  if (customer.email) {
    const emailResult = await sendNotification(
      customerId,
      NotificationChannel.EMAIL,
      NotificationType.RECONNECT_CONFIRMATION,
      customer.email,
      message,
      'Service Reconnected'
    );
    results.push(emailResult);
  }

  return results;
}


/**
 * Get notification logs with filters and pagination.
 * Requirements: 6.7
 */
export async function getNotificationLogs(
  filters: NotificationFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<Notification>> {
  const where: any = {};

  if (filters.customer_id) {
    where.customer_id = filters.customer_id;
  }
  if (filters.channel) {
    where.channel = filters.channel;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.date_from || filters.date_to) {
    where.created_at = {};
    if (filters.date_from) {
      where.created_at[Op.gte] = new Date(filters.date_from);
    }
    if (filters.date_to) {
      where.created_at[Op.lte] = new Date(filters.date_to);
    }
  }

  const offset = getOffset(pagination);

  const { rows, count } = await Notification.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'account_number'] },
    ],
    order: [[pagination.sort_by || 'created_at', pagination.sort_order || 'DESC']],
    limit: pagination.limit,
    offset,
  });

  return buildPaginatedResult(rows, count, pagination);
}

/**
 * Send scheduled reminders for customers with invoices due within 3 days.
 * This is called by the EventBridge-triggered handler.
 * Requirements: 6.1, 6.2, 6.4
 */
export async function sendScheduledReminders(): Promise<{
  due_reminders_sent: number;
  overdue_notices_sent: number;
  disconnect_warnings_sent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let dueRemindersSent = 0;
  let overdueNoticesSent = 0;
  let disconnectWarningsSent = 0;

  const today = dayjs.utc();
  const threeDaysFromNow = today.add(3, 'day').format('YYYY-MM-DD');
  const todayStr = today.format('YYYY-MM-DD');
  const oneDayFromNow = today.add(1, 'day').format('YYYY-MM-DD');

  // 1. Send due reminders (invoices due within 3 days)
  try {
    const customersDueSoon = await Customer.findAll({
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

    for (const customer of customersDueSoon) {
      try {
        await sendDueReminder(customer.id);
        dueRemindersSent++;
      } catch (err: any) {
        errors.push(`Due reminder failed for ${customer.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`Due reminder query failed: ${err.message}`);
  }

  // 2. Send overdue notices (invoices past due date)
  try {
    const customersOverdue = await Customer.findAll({
      include: [
        {
          model: Invoice,
          as: 'invoices',
          where: {
            status: InvoiceStatus.OVERDUE,
            due_date: { [Op.lt]: todayStr },
          },
          required: true,
        },
      ],
    });

    for (const customer of customersOverdue) {
      try {
        await sendOverdueNotice(customer.id);
        overdueNoticesSent++;
      } catch (err: any) {
        errors.push(`Overdue notice failed for ${customer.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`Overdue notice query failed: ${err.message}`);
  }

  // 3. Send disconnect warnings (1 day before auto-disconnect threshold)
  try {
    const customersToWarn = await Customer.findAll({
      include: [
        {
          model: Invoice,
          as: 'invoices',
          where: {
            status: InvoiceStatus.OVERDUE,
          },
          required: true,
        },
      ],
      where: {
        status: 'overdue',
      },
    });

    for (const customer of customersToWarn) {
      try {
        await sendDisconnectWarning(customer.id);
        disconnectWarningsSent++;
      } catch (err: any) {
        errors.push(`Disconnect warning failed for ${customer.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`Disconnect warning query failed: ${err.message}`);
  }

  return {
    due_reminders_sent: dueRemindersSent,
    overdue_notices_sent: overdueNoticesSent,
    disconnect_warnings_sent: disconnectWarningsSent,
    errors,
  };
}

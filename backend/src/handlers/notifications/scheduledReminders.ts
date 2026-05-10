import { ScheduledEvent, Context } from 'aws-lambda';
import { sendScheduledReminders } from '../../services/notificationService';

/**
 * EventBridge-triggered handler for scheduled notification reminders.
 * Runs on schedule (daily at 08:00 Manila / 00:00 UTC).
 *
 * Sends:
 * 1. Due reminders for invoices due within 3 days
 * 2. Overdue notices for past-due invoices
 * 3. Disconnect warnings for customers about to be disconnected
 *
 * Requirements: 6.1, 6.2, 6.4
 */
export async function main(event: ScheduledEvent, context: Context): Promise<void> {
  console.log('Running scheduled notification reminders', { event: event.source, time: event.time });

  const result = await sendScheduledReminders();

  console.log('Scheduled reminders completed', {
    due_reminders_sent: result.due_reminders_sent,
    overdue_notices_sent: result.overdue_notices_sent,
    disconnect_warnings_sent: result.disconnect_warnings_sent,
    errors_count: result.errors.length,
  });

  if (result.errors.length > 0) {
    console.error('Notification errors:', result.errors);
  }
}

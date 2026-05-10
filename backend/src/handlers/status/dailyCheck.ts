import { ScheduledEvent, Context } from 'aws-lambda';
import { runDailyStatusChecks } from '../../services/customerStatusService';

/**
 * EventBridge-triggered handler for daily customer status checks.
 * Runs on schedule (daily at 00:00 UTC+8 / 16:00 UTC).
 * 
 * Checks:
 * 1. Customers with invoices due within 3 days → DUE_SOON
 * 2. Customers with overdue invoices → OVERDUE
 */
export async function main(event: ScheduledEvent, context: Context): Promise<void> {
  console.log('Running daily status checks', { event: event.source, time: event.time });

  const result = await runDailyStatusChecks();

  console.log('Daily status check completed', {
    due_soon_updated: result.due_soon_updated,
    overdue_updated: result.overdue_updated,
    errors: result.errors,
  });

  if (result.errors.length > 0) {
    console.error('Status check errors:', result.errors);
  }
}

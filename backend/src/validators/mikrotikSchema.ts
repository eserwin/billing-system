import { z } from 'zod';

export const customerIdParamSchema = z.object({
  id: z.string().uuid('Invalid customer ID format'),
});

export const disconnectBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const reconnectBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const updateSettingsBodySchema = z.object({
  enabled: z.boolean().optional(),
  overdue_threshold_days: z.number().int().min(1).max(90).optional(),
}).refine(
  (data) => data.enabled !== undefined || data.overdue_threshold_days !== undefined,
  { message: 'At least one setting must be provided' }
);

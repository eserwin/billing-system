import { z } from 'zod';

export const generateInvoicesSchema = z.object({
  period_year: z.number().int().min(2000).max(2100),
  period_month: z.number().int().min(1).max(12),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
});

export const invoiceIdParamSchema = z.object({
  id: z.string().uuid('Invalid invoice ID format'),
});

export const invoiceListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.string().optional(),
  status: z.string().optional(),
  customer_id: z.string().uuid('Invalid customer ID format').optional(),
  period_year: z.string().optional(),
  period_month: z.string().optional(),
  search: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['unpaid', 'paid', 'partial', 'overdue']),
});

export const billingSummaryQuerySchema = z.object({
  period_year: z.string().optional(),
  period_month: z.string().optional(),
});

export type GenerateInvoicesDTO = z.infer<typeof generateInvoicesSchema>;
export type UpdateInvoiceStatusDTO = z.infer<typeof updateInvoiceStatusSchema>;

import { z } from 'zod';
import { PaymentMethod } from '../types/common';

export const recordPaymentSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID format'),
  invoice_id: z.string().uuid('Invalid invoice ID format'),
  amount: z.number().int().positive('Amount must be a positive integer (centavos)'),
  method: z.nativeEnum(PaymentMethod, { errorMap: () => ({ message: 'Invalid payment method' }) }),
  reference_number: z.string().optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid('Invalid payment ID format'),
});

export const paymentListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.string().optional(),
  customer_id: z.string().uuid('Invalid customer ID format').optional(),
  invoice_id: z.string().uuid('Invalid invoice ID format').optional(),
  method: z.string().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from must be in YYYY-MM-DD format').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to must be in YYYY-MM-DD format').optional(),
  search: z.string().optional(),
});

export type RecordPaymentDTO = z.infer<typeof recordPaymentSchema>;


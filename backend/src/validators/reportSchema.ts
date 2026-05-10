import { z } from 'zod';

export const collectionReportQuerySchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from must be in YYYY-MM-DD format'),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to must be in YYYY-MM-DD format'),
});

export const monthlyIncomeQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'year must be a 4-digit number'),
});

export type CollectionReportQuery = z.infer<typeof collectionReportQuerySchema>;
export type MonthlyIncomeQuery = z.infer<typeof monthlyIncomeQuerySchema>;

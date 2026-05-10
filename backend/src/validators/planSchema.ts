import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(255),
  speed: z.string().min(1, 'Speed is required').max(100),
  monthly_fee: z.number().int('Monthly fee must be an integer').min(0, 'Monthly fee must be non-negative'),
  installation_fee: z.number().int('Installation fee must be an integer').min(0, 'Installation fee must be non-negative').optional().default(0),
});

export const updatePlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  speed: z.string().min(1).max(100).optional(),
  monthly_fee: z.number().int('Monthly fee must be an integer').min(0, 'Monthly fee must be non-negative').optional(),
  installation_fee: z.number().int('Installation fee must be an integer').min(0, 'Installation fee must be non-negative').optional(),
});

export const planIdParamSchema = z.object({
  id: z.string().uuid('Invalid plan ID format'),
});

export const togglePlanStatusSchema = z.object({
  is_active: z.boolean(),
});

export const planListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.string().optional(),
  is_active: z.string().optional(),
  search: z.string().optional(),
});

export type CreatePlanDTO = z.infer<typeof createPlanSchema>;
export type UpdatePlanDTO = z.infer<typeof updatePlanSchema>;

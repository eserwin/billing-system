import { z } from 'zod';

export const createCustomerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  address: z.string().min(1, 'Address is required'),
  mobile_number: z.string().min(1, 'Mobile number is required').max(20),
  email: z.string().email('Invalid email format').nullable().optional(),
  installation_address: z.string().min(1, 'Installation address is required'),
  service_area: z.string().min(1, 'Service area is required').max(255),
  plan_id: z.string().uuid('Invalid plan ID format'),
  installation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Installation date must be in YYYY-MM-DD format'),
});

export const updateCustomerSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  address: z.string().min(1).optional(),
  mobile_number: z.string().min(1).max(20).optional(),
  email: z.string().email('Invalid email format').nullable().optional(),
  installation_address: z.string().min(1).optional(),
  service_area: z.string().min(1).max(255).optional(),
  plan_id: z.string().uuid('Invalid plan ID format').optional(),
  installation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Installation date must be in YYYY-MM-DD format').optional(),
});

export const customerIdParamSchema = z.object({
  id: z.string().uuid('Invalid customer ID format'),
});

export const customerListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.string().optional(),
  status: z.string().optional(),
  service_area: z.string().optional(),
  plan_id: z.string().optional(),
  search: z.string().optional(),
});

export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDTO = z.infer<typeof updateCustomerSchema>;

import { z } from 'zod';
import { UserRole } from '../types/common';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(255),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role. Must be SuperAdmin, Admin, or Cashier' }) }),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role. Must be SuperAdmin, Admin, or Cashier' }) }).optional(),
}).refine((data) => data.full_name || data.role, {
  message: 'At least one field (full_name or role) must be provided',
});

export const userListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
}).passthrough();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

import { z } from 'zod';

export const createDownpaymentCategorySchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must be less than 100 characters'),
  priceLimit: z
    .number()
    .int()
    .min(0, 'Price limit must be positive'),
  url: z
    .string()
    .url('Invalid URL format'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5722)'),
  icon: z
    .string()
    .min(1, 'Icon is required')
    .max(50, 'Icon must be less than 50 characters'),
  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

export const updateDownpaymentCategorySchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must be less than 100 characters')
    .optional(),
  priceLimit: z
    .number()
    .int()
    .min(0, 'Price limit must be positive')
    .optional(),
  url: z
    .string()
    .url('Invalid URL format')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5722)')
    .optional(),
  icon: z
    .string()
    .min(1, 'Icon is required')
    .max(50, 'Icon must be less than 50 characters')
    .optional(),
  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

export const downpaymentIdSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});

export type CreateDownpaymentCategoryInput = z.infer<typeof createDownpaymentCategorySchema>;
export type UpdateDownpaymentCategoryInput = z.infer<typeof updateDownpaymentCategorySchema>;
export type DownpaymentIdInput = z.infer<typeof downpaymentIdSchema>;









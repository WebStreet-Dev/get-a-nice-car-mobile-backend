import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters'),
  googleMapsLink: z
    .string()
    .url('Invalid URL format')
    .optional()
    .nullable(),
  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

export const updateLocationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .optional(),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  googleMapsLink: z
    .string()
    .url('Invalid URL format')
    .optional()
    .nullable(),
  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

export const locationIdSchema = z.object({
  id: z.string().uuid('Invalid location ID'),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationIdInput = z.infer<typeof locationIdSchema>;

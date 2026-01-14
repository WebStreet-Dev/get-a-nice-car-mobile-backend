import { z } from 'zod';

export const createLocationSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must be less than 100 characters'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters'),
  mapLink: z
    .string()
    .url('Invalid map link URL format')
    .max(1000, 'Map link must be less than 1000 characters'),
  displayOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

export const updateLocationSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must be less than 100 characters')
    .optional(),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  mapLink: z
    .string()
    .url('Invalid map link URL format')
    .max(1000, 'Map link must be less than 1000 characters')
    .optional(),
  displayOrder: z
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

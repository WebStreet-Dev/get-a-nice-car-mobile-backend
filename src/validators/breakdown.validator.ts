import { z } from 'zod';

export const createBreakdownRequestSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  locationType: z
    .enum(['CURRENT', 'LIVE'], {
      errorMap: () => ({ message: 'Location type must be CURRENT or LIVE' }),
    }),
  liveDurationMinutes: z
    .number()
    .int()
    .min(15, 'Live duration must be at least 15 minutes')
    .max(480, 'Live duration cannot exceed 8 hours')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
});

export const updateLocationSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

export const breakdownIdSchema = z.object({
  id: z.string().uuid('Invalid breakdown request ID'),
});

export type CreateBreakdownRequestInput = z.infer<typeof createBreakdownRequestSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type BreakdownIdInput = z.infer<typeof breakdownIdSchema>;









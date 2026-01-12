import { z } from 'zod';

export const createAppointmentSchema = z.object({
  departmentId: z
    .string()
    .uuid('Invalid department ID'),
  dateTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  vehicleOfInterest: z
    .string()
    .max(200, 'Vehicle of interest must be less than 200 characters')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  contactName: z
    .string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name must be less than 100 characters')
    .optional(),
  contactEmail: z
    .string()
    .email('Invalid email address')
    .optional(),
  contactPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
});

export const updateAppointmentSchema = z.object({
  departmentId: z
    .string()
    .uuid('Invalid department ID')
    .optional(),
  dateTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
    .optional(),
  vehicleOfInterest: z
    .string()
    .max(200, 'Vehicle of interest must be less than 200 characters')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable(),
  contactName: z
    .string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name must be less than 100 characters')
    .optional()
    .nullable(),
  contactEmail: z
    .string()
    .email('Invalid email address')
    .optional()
    .nullable(),
  contactPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .nullable(),
});

export const appointmentIdSchema = z.object({
  id: z.string().uuid('Invalid appointment ID'),
});

export const appointmentQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .optional(),
  departmentId: z
    .string()
    .uuid('Invalid department ID')
    .optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentIdInput = z.infer<typeof appointmentIdSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;









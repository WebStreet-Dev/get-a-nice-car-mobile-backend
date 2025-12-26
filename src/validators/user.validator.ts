import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z
    .string()
    .min(1, 'FCM token is required'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateFcmTokenInput = z.infer<typeof updateFcmTokenSchema>;





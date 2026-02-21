import { z } from 'zod';

export const registerDeviceTokenSchema = z.object({
  fcmToken: z
    .string()
    .min(50, 'FCM token must be at least 50 characters')
    .max(500, 'FCM token must be less than 500 characters'),
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;

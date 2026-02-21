import prisma from './prisma.service.js';
import logger from '../utils/logger.js';

/**
 * Register or refresh FCM token for a guest device (no auth).
 * Used so broadcast can be sent to all app installs including guests.
 */
export async function registerDeviceToken(fcmToken: string): Promise<void> {
  const token = fcmToken.trim();
  if (!token) {
    throw new Error('FCM token is required');
  }

  await prisma.deviceToken.upsert({
    where: { token },
    create: {
      token,
      userId: null, // guest
    },
    update: {
      updatedAt: new Date(),
    },
  });

  logger.debug('Device token registered for guest', {
    tokenPrefix: token.substring(0, 20) + '...',
  });
}

/**
 * Get all guest device tokens (userId is null).
 */
export async function getGuestDeviceTokens(): Promise<string[]> {
  const rows = await prisma.deviceToken.findMany({
    where: { userId: null },
    select: { token: true },
  });
  return rows.map((r) => r.token);
}

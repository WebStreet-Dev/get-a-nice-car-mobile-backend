// Quick test script to check notifications and FCM tokens
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // Check admin notifications
    console.log('\n=== Admin Notifications ===');
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`Found ${notifications.length} admin notifications`);
    notifications.forEach(n => {
      console.log(`- ${n.title} (${n.type}) - Created: ${n.createdAt.toISOString()}`);
    });

    // Check super admin FCM token
    console.log('\n=== Super Admin FCM Token ===');
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { email: true, fcmToken: true, role: true },
    });
    if (superAdmin) {
      console.log(`Email: ${superAdmin.email}`);
      console.log(`FCM Token: ${superAdmin.fcmToken ? 'SET (' + superAdmin.fcmToken.length + ' chars)' : 'NOT SET'}`);
    } else {
      console.log('Super admin not found');
    }

    // Check all admins with FCM tokens
    console.log('\n=== All Admins with FCM Tokens ===');
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        fcmToken: { not: null },
      },
      select: { email: true, role: true, fcmToken: true },
    });
    console.log(`Found ${admins.length} admins with FCM tokens`);
    admins.forEach(a => {
      console.log(`- ${a.email} (${a.role}) - Token: ${a.fcmToken?.substring(0, 20)}...`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();


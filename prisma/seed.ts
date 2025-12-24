import { PrismaClient, Role, FAQCategory, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create super admin user
  const superAdminPassword = await bcrypt.hash('superadmin123456', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@getanicecar.com' },
    update: {
      accountStatus: AccountStatus.APPROVED,
      approvedAt: new Date(),
      isActive: true,
    },
    create: {
      name: 'Super Admin',
      email: 'superadmin@getanicecar.com',
      phone: '+1 (555) 000-0001',
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
      accountStatus: AccountStatus.APPROVED,
      approvedAt: new Date(),
      isActive: true,
    },
  });
  console.log(`✅ Super Admin user created: ${superAdmin.email}`);

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@getanicecar.com' },
    update: {
      accountStatus: AccountStatus.APPROVED,
      approvedAt: new Date(),
      isActive: true,
    },
    create: {
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@getanicecar.com',
      phone: '+1 (555) 000-0000',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      accountStatus: AccountStatus.APPROVED,
      approvedAt: new Date(),
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create test user
  const testPassword = await bcrypt.hash('test123456', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {
      accountStatus: AccountStatus.APPROVED,
      approvedAt: new Date(),
      isActive: true,
    },
    create: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      passwordHash: testPassword,
      role: Role.USER,
      accountStatus: AccountStatus.APPROVED,
      approvedAt: new Date(),
      isActive: true,
    },
  });
  console.log(`✅ Test user created: ${testUser.email}`);

  // Create departments
  const departments = [
    {
      name: 'Sales',
      phone: '+1 (555) 123-4567',
      email: 'sales@getanicecar.com',
      description: 'Find your perfect vehicle with our expert sales team',
      icon: 'sales',
      sortOrder: 1,
    },
    {
      name: 'Service',
      phone: '+1 (555) 123-4568',
      email: 'service@getanicecar.com',
      description: 'Professional vehicle maintenance and repair services',
      icon: 'service',
      sortOrder: 2,
    },
    {
      name: 'Accounting',
      phone: '+1 (555) 123-4569',
      email: 'accounting@getanicecar.com',
      description: 'Payment processing and financing inquiries',
      icon: 'accounting',
      sortOrder: 3,
    },
    {
      name: 'General',
      phone: '+1 (555) 123-4570',
      email: 'info@getanicecar.com',
      description: 'General inquiries and customer support',
      icon: 'general',
      sortOrder: 4,
    },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: dept,
      create: dept,
    });
  }
  console.log(`✅ ${departments.length} departments created`);

  // Create FAQs
  const faqs = [
    {
      question: 'What financing options do you offer?',
      answer: 'We offer various financing options including traditional loans, lease options, and special promotions. Our finance team can help you find the best option for your budget.',
      category: FAQCategory.SALES,
      sortOrder: 1,
    },
    {
      question: 'Do you offer vehicle warranties?',
      answer: 'Yes, we offer comprehensive warranty packages for both new and used vehicles. Our service team can explain the different warranty options available.',
      category: FAQCategory.SERVICE,
      sortOrder: 2,
    },
    {
      question: 'What are your business hours?',
      answer: 'We are open Monday through Saturday from 9 AM to 7 PM, and Sunday from 10 AM to 5 PM. Our service department hours may vary.',
      category: FAQCategory.GENERAL,
      sortOrder: 3,
    },
    {
      question: 'How do I schedule a service appointment?',
      answer: 'You can schedule a service appointment through our app, by calling our service department, or by visiting us in person. Registered users can book appointments directly through the app.',
      category: FAQCategory.SERVICE,
      sortOrder: 4,
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept cash, credit cards, debit cards, and financing options. For more information about payment methods, please contact our accounting department.',
      category: FAQCategory.ACCOUNTING,
      sortOrder: 5,
    },
    {
      question: 'Do you offer trade-in services?',
      answer: 'Yes, we offer trade-in services for your current vehicle. Our sales team can provide a free evaluation and offer competitive trade-in values.',
      category: FAQCategory.SALES,
      sortOrder: 6,
    },
    {
      question: 'Can I get a vehicle history report?',
      answer: 'Yes, we provide complimentary vehicle history reports for all our used vehicles. Ask your sales representative for more details.',
      category: FAQCategory.SALES,
      sortOrder: 7,
    },
    {
      question: 'What should I do if my car breaks down?',
      answer: 'If your car breaks down, you can use our app to share your location with our service team. We offer roadside assistance and can help coordinate towing services.',
      category: FAQCategory.SERVICE,
      sortOrder: 8,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.upsert({
      where: { id: `faq-${faq.sortOrder}` },
      update: faq,
      create: {
        id: `faq-${faq.sortOrder}`,
        ...faq,
      },
    });
  }
  console.log(`✅ ${faqs.length} FAQs created`);

  // Create sample appointments for test user
  const salesDept = await prisma.department.findFirst({ where: { name: 'Sales' } });
  const serviceDept = await prisma.department.findFirst({ where: { name: 'Service' } });

  if (salesDept && serviceDept) {
    const appointments = [
      {
        userId: testUser.id,
        departmentId: salesDept.id,
        dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        vehicleOfInterest: '2024 Toyota Camry',
        notes: 'Interested in test drive',
        status: 'CONFIRMED' as const,
      },
      {
        userId: testUser.id,
        departmentId: serviceDept.id,
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        notes: 'Regular maintenance',
        status: 'PENDING' as const,
      },
    ];

    for (const apt of appointments) {
      await prisma.appointment.create({
        data: apt,
      });
    }
    console.log(`✅ ${appointments.length} sample appointments created`);
  }

  // Create sample notifications for test user
  const notifications = [
    {
      userId: testUser.id,
      title: 'Welcome to Nice Car!',
      message: 'Thank you for joining us. Start exploring our inventory today!',
      type: 'GENERAL' as const,
    },
    {
      userId: testUser.id,
      title: 'Appointment Confirmed',
      message: 'Your sales appointment has been confirmed for 3 days from now.',
      type: 'APPOINTMENT' as const,
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification,
    });
  }
  console.log(`✅ ${notifications.length} sample notifications created`);

  // Create downpayment categories
  const downpaymentCategories = [
    {
      label: '$1500 AND Under',
      priceLimit: 1500,
      url: 'https://nicecar1977.com/inventory/category/$1500%20AND%20Under',
      color: '#4CAF50',
      icon: 'directions_car',
      sortOrder: 1,
    },
    {
      label: '$2000 AND Under',
      priceLimit: 2000,
      url: 'https://nicecar1977.com/inventory/category/$2000%20AND%20Under',
      color: '#8BC34A',
      icon: 'directions_car',
      sortOrder: 2,
    },
    {
      label: '$2500 AND Under',
      priceLimit: 2500,
      url: 'https://nicecar1977.com/inventory/category/$2500%20AND%20Under',
      color: '#CDDC39',
      icon: 'directions_car',
      sortOrder: 3,
    },
    {
      label: '$3000 AND Under',
      priceLimit: 3000,
      url: 'https://nicecar1977.com/inventory/category/$3000%20AND%20Under',
      color: '#FFEB3B',
      icon: 'directions_car',
      sortOrder: 4,
    },
    {
      label: '$3500 AND Under',
      priceLimit: 3500,
      url: 'https://nicecar1977.com/inventory/category/$3500%20AND%20Under',
      color: '#FFC107',
      icon: 'directions_car',
      sortOrder: 5,
    },
    {
      label: '$4000 AND Under',
      priceLimit: 4000,
      url: 'https://nicecar1977.com/inventory/category/$4000%20AND%20Under',
      color: '#FF9800',
      icon: 'directions_car',
      sortOrder: 6,
    },
    {
      label: '$4500 AND Under',
      priceLimit: 4500,
      url: 'https://nicecar1977.com/inventory/category/$4500%20AND%20Under',
      color: '#FF5722',
      icon: 'directions_car',
      sortOrder: 7,
    },
    {
      label: '$5000 AND Under',
      priceLimit: 5000,
      url: 'https://nicecar1977.com/inventory/category/$5000%20AND%20Under',
      color: '#F44336',
      icon: 'directions_car',
      sortOrder: 8,
    },
    {
      label: '$6000 AND Under',
      priceLimit: 6000,
      url: 'https://nicecar1977.com/inventory/category/$6000%20AND%20Under',
      color: '#9C27B0',
      icon: 'star',
      sortOrder: 9,
    },
  ];

  for (const category of downpaymentCategories) {
    await prisma.downpaymentCategory.upsert({
      where: { id: `dp-${category.sortOrder}` },
      update: category,
      create: {
        id: `dp-${category.sortOrder}`,
        ...category,
      },
    });
  }
  console.log(`✅ ${downpaymentCategories.length} downpayment categories created`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





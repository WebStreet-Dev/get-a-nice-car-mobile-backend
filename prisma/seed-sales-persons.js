const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSalesPersons() {
  try {
    console.log('Seeding sales persons...');

    // Jimmy Martinez
    await prisma.$executeRaw`
      INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, 'Jimmy Martinez', '(305) 894-6062', 'ncsales5813@gmail.com', 'img/jimmy.jpeg', true, 1, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "sales_persons" WHERE "name" = 'Jimmy Martinez')
    `;
    console.log('✓ Jimmy Martinez');

    // Cash
    await prisma.$executeRaw`
      INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, 'Cash', '(954) 647-3151', 'nicecar1977@gmail.com', 'img/cash.jpeg', true, 2, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "sales_persons" WHERE "name" = 'Cash')
    `;
    console.log('✓ Cash');

    // Jeff Ouellette
    await prisma.$executeRaw`
      INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, 'Jeff Ouellette', '(954) 865-4820', 'usedcarjeff@gmail.com', 'img/jeff.jpeg', true, 3, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "sales_persons" WHERE "name" = 'Jeff Ouellette')
    `;
    console.log('✓ Jeff Ouellette');

    // Franco
    await prisma.$executeRaw`
      INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
      SELECT gen_random_uuid()::text, 'Franco', '786-667-2916', '', 'img/franco.jpeg', true, 4, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "sales_persons" WHERE "name" = 'Franco')
    `;
    console.log('✓ Franco');

    console.log('\n✅ Sales persons seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding sales persons:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSalesPersons();

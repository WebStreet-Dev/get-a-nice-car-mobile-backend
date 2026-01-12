Prisma Seed Issue – Production Debug & Fix Guide (Coolify)

✅ How to PROVE the issue (1 command)

Run this inside the PostgreSQL database container:

SELECT count(*) FROM departments;

Expected output (current situation)

0

This proves:
	•	Database connection works
	•	Tables exist
	•	Seed data was NOT inserted

⸻

❌ Why the Seed Is Not Working

Current seed configuration in package.json

"db:seed": "tsx prisma/seed.ts"

Problem
	•	tsx is a devDependency
	•	Production containers do not install devDependencies
	•	prisma db seed fails silently when the seed command cannot run
	•	No error is thrown
	•	Result: empty tables

This is expected Prisma behavior, not a bug.

⸻

✅ Correct Fix (Production-Safe)

🔥 Convert seed file to JavaScript

1️⃣ Create file

prisma/seed.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.department.createMany({
    data: [
      {
        name: 'Sales',
        phone: '+1 (555) 123-4567',
        email: 'sales@getanicecar.com',
        description: 'Sales department',
        icon: 'sales',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Service',
        phone: '+1 (555) 123-4568',
        email: 'service@getanicecar.com',
        description: 'Service department',
        icon: 'service',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'Accounting',
        phone: '+1 (555) 123-4569',
        email: 'accounting@getanicecar.com',
        description: 'Accounting department',
        icon: 'accounting',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'General',
        phone: '+1 (555) 123-4570',
        email: 'info@getanicecar.com',
        description: 'General inquiries',
        icon: 'general',
        sortOrder: 4,
        isActive: true,
      }
    ],
    skipDuplicates: true
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


⸻

2️⃣ Update package.json

Add this exactly:

"prisma": {
  "seed": "node prisma/seed.js"
}

⚠️ This overrides the default Prisma seed command.

⸻

3️⃣ Run seed in production container

npx prisma db seed

This time it will actually insert rows.

⸻

✅ Verify Database

SELECT * FROM departments;

Expected: rows exist.

⸻

✅ Verify API

curl http://<BACKEND_URL>/api/v1/departments

Expected response:

{
  "success": true,
  "data": [
    { "name": "Sales" },
    { "name": "Service" },
    { "name": "Accounting" },
    { "name": "General" }
  ]
}


⸻

❌ Do NOT Restart the Container

Restarting:
	•	Does NOT run seed
	•	Does NOT install tsx
	•	Does NOT change Prisma behavior

Restart is not required.

⸻

🧠 Root Cause (One Line)

TypeScript Prisma seeds do not run in production unless tsx is installed

⸻

✅ Final State
	•	Prisma schema synced
	•	Database connected
	•	API reachable externally
	•	Seed data correctly inserted
	•	Coolify deployment stable
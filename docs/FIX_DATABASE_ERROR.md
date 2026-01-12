# Fix "Database error" After Deployment

## Problem
After deployment, you're getting `500 Internal Server Error` with `"error": "Database error"` on login and other endpoints.

## Root Cause
The code was deployed with the new schema (expecting `userType` field), but the **production database doesn't have the `user_type` column yet**.

## Solution: Apply Database Migration to Production

### Option 1: Use Prisma db push (Recommended - Quick)

Connect to your production database and run:

```bash
# In Coolify terminal or SSH to your server
cd /app
npx prisma db push
```

This will:
- Add `UserType` enum
- Add `user_type` column to `users` table
- Set existing users to CLIENT
- Set existing ADMIN/SUPER_ADMIN to EMPLOYEE

### Option 2: Run Migration SQL Manually

If you have direct database access, run this SQL:

```sql
-- Add UserType enum
CREATE TYPE "UserType" AS ENUM ('CLIENT', 'EMPLOYEE');

-- Add userType column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "user_type" "UserType" NOT NULL DEFAULT 'CLIENT';

-- Create index on userType
CREATE INDEX IF NOT EXISTS "users_user_type_idx" ON "users"("user_type");

-- Update existing users: set all current users as CLIENT
UPDATE "users" SET "user_type" = 'CLIENT' WHERE "user_type" IS NULL;

-- Set existing ADMIN and SUPER_ADMIN users as EMPLOYEE
UPDATE "users" SET "user_type" = 'EMPLOYEE' WHERE "role" IN ('ADMIN', 'SUPER_ADMIN');
```

### Option 3: Via Coolify Terminal

1. Go to Coolify dashboard
2. Open your backend application
3. Click on "Terminal" or "Shell" access
4. Run:
   ```bash
   cd /app
   npx prisma db push
   ```

### Option 4: Add Migration to Startup (Temporary Fix)

If you can't access the database directly, you can add a migration script that runs on startup. However, this is not recommended for production.

## Verify Fix

After applying the migration, test:

1. **Login endpoint:**
   ```
   POST /api/v1/auth/login
   ```
   Should work without "Database error"

2. **Check database:**
   ```sql
   SELECT id, email, role, user_type FROM users LIMIT 5;
   ```
   Should show `user_type` column with values

## Why This Happened

1. ✅ Code was deployed with new schema
2. ✅ Prisma Client was generated with `UserType` enum
3. ❌ Database migration was NOT applied to production
4. ❌ When app queries `userType`, database throws error (column doesn't exist)

## Prevention

For future deployments:
- Always run migrations before or immediately after code deployment
- Use `prisma migrate deploy` in production (instead of `db push`)
- Add migration step to your deployment pipeline

## Quick Check

To verify if this is the issue, check the application logs in Coolify. You should see errors like:
- `column "user_type" does not exist`
- `type "UserType" does not exist`
- Prisma query errors related to `userType`

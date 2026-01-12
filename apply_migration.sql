-- Apply UserType migration to production database
-- Run this SQL directly on your production PostgreSQL database

-- Step 1: Add UserType enum (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserType') THEN
        CREATE TYPE "UserType" AS ENUM ('CLIENT', 'EMPLOYEE');
    END IF;
END $$;

-- Step 2: Add user_type column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "user_type" "UserType" NOT NULL DEFAULT 'CLIENT';
    END IF;
END $$;

-- Step 3: Create index (if it doesn't exist)
CREATE INDEX IF NOT EXISTS "users_user_type_idx" ON "users"("user_type");

-- Step 4: Update existing users
-- Set all current users as CLIENT (if user_type is NULL)
UPDATE "users" SET "user_type" = 'CLIENT' WHERE "user_type" IS NULL;

-- Set existing ADMIN and SUPER_ADMIN users as EMPLOYEE
UPDATE "users" SET "user_type" = 'EMPLOYEE' WHERE "role" IN ('ADMIN', 'SUPER_ADMIN');

-- Verify the migration
SELECT 
    role,
    user_type,
    COUNT(*) as count
FROM users
GROUP BY role, user_type
ORDER BY role, user_type;




-- Add userType enum
CREATE TYPE "UserType" AS ENUM ('CLIENT', 'EMPLOYEE');

-- Add userType column to users table
ALTER TABLE "users" ADD COLUMN "user_type" "UserType" NOT NULL DEFAULT 'CLIENT';

-- Create index on userType
CREATE INDEX "users_user_type_idx" ON "users"("user_type");

-- Update existing users: set all current users as CLIENT
-- (Admins and Super Admins will be updated separately if needed)
UPDATE "users" SET "user_type" = 'CLIENT' WHERE "user_type" IS NULL;

-- Set existing ADMIN and SUPER_ADMIN users as EMPLOYEE
UPDATE "users" SET "user_type" = 'EMPLOYEE' WHERE "role" IN ('ADMIN', 'SUPER_ADMIN');

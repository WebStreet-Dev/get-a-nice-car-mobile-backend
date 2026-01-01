# Fix Migration Drift - Options

## Problem
Your database already has tables, but Prisma's migration history doesn't match. This happens when:
- Database was created manually or with `prisma db push`
- Migration files were deleted or lost
- Database was created from a different source

## Solution Options

### Option 1: Baseline Current State (RECOMMENDED - No Data Loss)
This marks your current database state as the baseline and only adds the new UserType changes.

```bash
# Step 1: Create a baseline migration
npx prisma migrate resolve --applied add_user_type

# Step 2: If that doesn't work, create a new migration that only adds UserType
npx prisma migrate dev --create-only --name add_user_type_only

# Step 3: Edit the migration file to only include UserType changes
# Step 4: Apply it
npx prisma migrate dev
```

### Option 2: Use db push (Quick Fix - Development Only)
This syncs schema without migration history. Good for development, not recommended for production.

```bash
npx prisma db push
```

This will:
- Add UserType enum
- Add user_type column
- Create index
- Update existing data

### Option 3: Reset Database (⚠️ DELETES ALL DATA)
Only use if you don't have important data or it's a fresh development environment.

```bash
npx prisma migrate reset
```

## Recommended Approach

Since you have existing data, use **Option 2 (db push)** for now:

```bash
cd backend
npx prisma db push
```

This will:
1. Add the `UserType` enum
2. Add `user_type` column to users table
3. Set default to CLIENT
4. Update existing ADMIN/SUPER_ADMIN to EMPLOYEE
5. Create index

**No data will be lost!**

## After db push

1. Regenerate Prisma Client:
```bash
npx prisma generate
```

2. Restart your server:
```bash
npm run dev
```

## For Production Later

When you're ready for proper migrations in production:
1. Use `prisma migrate deploy` 
2. Or set up proper migration baseline

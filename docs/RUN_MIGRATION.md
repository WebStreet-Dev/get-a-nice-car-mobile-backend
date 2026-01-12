# How to Run Database Migration

## Prerequisites
- Node.js installed
- PostgreSQL database running
- Database connection configured in `.env` file

## Step-by-Step Instructions

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Check Database Connection
Make sure your `.env` file has the correct `DATABASE_URL`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### 3. Run the Migration
```bash
npx prisma migrate dev --name add_user_type
```

This command will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your database
- Regenerate the Prisma Client automatically

### 4. Verify Migration
After the migration completes, you should see:
- ✅ Migration created successfully
- ✅ Prisma Client regenerated

### 5. (Optional) Check Migration Status
```bash
npx prisma migrate status
```

### 6. (Optional) View Database Schema
```bash
npx prisma studio
```
This opens a visual database browser where you can verify the `user_type` column was added.

## Alternative: Manual Migration (if needed)

If you prefer to run the migration manually or if you're in production:

### 1. Generate Migration SQL
```bash
npx prisma migrate dev --create-only --name add_user_type
```

### 2. Review the Generated SQL
Check the file in `prisma/migrations/[timestamp]_add_user_type/migration.sql`

### 3. Apply Migration
```bash
npx prisma migrate deploy
```

## Troubleshooting

### Error: "Migration failed"
- Check database connection in `.env`
- Ensure database is running
- Check if migration already exists

### Error: "Column already exists"
- The migration may have already been applied
- Check with: `npx prisma migrate status`

### Reset Database (Development Only)
⚠️ **WARNING: This will delete all data!**
```bash
npx prisma migrate reset
```

## What the Migration Does

1. Creates `UserType` enum with values: `CLIENT`, `EMPLOYEE`
2. Adds `user_type` column to `users` table
3. Sets default value to `CLIENT` for existing rows
4. Sets existing ADMIN/SUPER_ADMIN users to `EMPLOYEE`
5. Creates index on `user_type` for performance

## After Migration

1. Restart your backend server:
   ```bash
   npm run dev
   ```

2. Test the new endpoints:
   - `GET /api/v1/admin/clients`
   - `GET /api/v1/admin/employees`

3. Verify in Prisma Studio:
   ```bash
   npx prisma studio
   ```
   Check that users have the `userType` field populated.


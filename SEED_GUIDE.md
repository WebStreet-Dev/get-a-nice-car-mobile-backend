# Database Seeding Guide

This guide explains how to run the database seed script both locally and on the server.

## Important: Production Seed Fix

⚠️ **Production Note**: The seed script uses **JavaScript** (`prisma/seed.js`) for production compatibility. The TypeScript version (`prisma/seed.ts`) is available for local development, but production containers use `node prisma/seed.js` which doesn't require `tsx` (a devDependency).

This ensures the seed script works in production environments where devDependencies are not installed.

## What Does the Seed Script Do?

The seed script (`prisma/seed.js` for production, `prisma/seed.ts` for local dev) creates initial data for the application:

- **Users**: Super Admin, Admin, and Test User accounts
- **Departments**: Sales, Service, Accounting, and General
- **FAQs**: Sample frequently asked questions
- **Downpayment Categories**: Price range categories for vehicle inventory
- **Sample Data**: Test appointments and notifications

## Prerequisites

Before running the seed script, ensure:

1. **Database is set up and accessible**
   - Local: PostgreSQL running and `DATABASE_URL` configured in `.env`
   - Server: Database container/service is running

2. **Prisma Client is generated**
   ```bash
   npm run db:generate
   # or
   npx prisma generate
   ```

3. **Database schema is applied**
   ```bash
   # For development
   npm run db:push
   # or
   npm run db:migrate
   
   # For production
   npm run db:migrate:prod
   ```

## Running Seed Locally

### Method 1: Using npm script (Recommended)

```bash
npm run db:seed
```

### Method 2: Using Prisma CLI

```bash
npx prisma db seed
```

This uses the JavaScript version (`seed.js`) configured in `package.json`, which works in both development and production.

### Method 3: Direct execution (Local development with TypeScript)

```bash
npx tsx prisma/seed.ts
```

**Note**: This requires `tsx` (devDependency) and only works locally. For production, use Method 1 or 2.

### Environment Variables (Optional)

The seed script uses these optional environment variables:

- `ADMIN_EMAIL`: Admin user email (default: `admin@getanicecar.com`)
- `ADMIN_PASSWORD`: Admin user password (default: `admin123456`)

To use custom values:

```bash
ADMIN_EMAIL=custom@example.com ADMIN_PASSWORD=securepass123 npm run db:seed
```

Or create a `.env` file:

```env
ADMIN_EMAIL=custom@example.com
ADMIN_PASSWORD=securepass123
```

## Running Seed on Server

### Using Docker Compose

If you're using Docker Compose for deployment:

```bash
# SSH into your server
ssh user@your-server

# Navigate to project directory
cd /var/www/nicecar/backend

# Run seed inside the API container
docker-compose exec api npm run db:seed
```

Or using Prisma CLI directly:

```bash
docker-compose exec api npx prisma db seed
```

### Using Docker (Standalone Container)

If running in a Docker container:

```bash
# Execute seed command in running container
docker exec -it <container-name> npm run db:seed

# Or using Prisma CLI
docker exec -it <container-name> npx prisma db seed
```

### Direct Server Execution (Non-Docker)

If running directly on the server without Docker:

```bash
# SSH into server
ssh user@your-server

# Navigate to project directory
cd /var/www/nicecar/backend

# Ensure dependencies are installed
npm install --production

# Generate Prisma Client
npm run db:generate

# Run migrations first
npm run db:migrate:prod

# Run seed
npm run db:seed
```

## Seed Script Details

### Default Users Created

1. **Super Admin**
   - Email: `superadmin@getanicecar.com`
   - Password: `superadmin123456`
   - Role: `SUPER_ADMIN`
   - Status: Approved

2. **Admin** (configurable via env vars)
   - Email: `admin@getanicecar.com` (or `ADMIN_EMAIL`)
   - Password: `admin123456` (or `ADMIN_PASSWORD`)
   - Role: `ADMIN`
   - Status: Approved

3. **Test User**
   - Email: `john.doe@example.com`
   - Password: `test123456`
   - Role: `USER`
   - Status: Approved

### Data Created

- **4 Departments**: Sales, Service, Accounting, General
- **8 FAQs**: Various categories (Sales, Service, General, Accounting)
- **9 Downpayment Categories**: Price ranges from $1500 to $6000
- **Sample Appointments**: 2 appointments for test user
- **Sample Notifications**: 2 notifications for test user

## Important Notes

⚠️ **Warning**: The seed script uses `upsert` operations, which means:
- If data already exists, it will be **updated** (not duplicated)
- Running the seed multiple times is safe
- Existing data may be overwritten with seed values

⚠️ **Production Considerations**:
- Only run seed on a fresh database or when you want to reset initial data
- Review the seed script before running in production
- Consider backing up your database before seeding
- The seed script creates default passwords - **change them immediately** in production

## Troubleshooting

### Error: "Prisma Client has not been generated"

```bash
npm run db:generate
```

### Error: "Database connection failed"

- Check your `DATABASE_URL` environment variable
- Verify database is running and accessible
- Check network connectivity (for remote databases)

### Error: "Schema is not in sync"

```bash
# For development
npm run db:push

# For production
npm run db:migrate:prod
```

### Error: "Cannot find module 'tsx'"

```bash
# Install dependencies
npm install

# Or install tsx globally
npm install -g tsx
```

### Seed runs but no data appears

- Check database connection string
- Verify you're looking at the correct database
- Check for error messages in the console output
- Use Prisma Studio to inspect the database:
  ```bash
  npm run db:studio
  ```

## Verification

After running the seed, verify the data:

### Using Prisma Studio

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can browse all tables.

### Using Database Client

Connect to your database and query:

```sql
-- Check users
SELECT email, role, "accountStatus" FROM users;

-- Check departments
SELECT name, email FROM departments;

-- Check FAQs
SELECT question, category FROM faqs;

-- Check downpayment categories
SELECT label, "priceLimit" FROM downpayment_categories;
```

## Resetting Database

If you need to completely reset the database and reseed:

```bash
# ⚠️ WARNING: This will delete all data!

# Reset database (development only)
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Apply all migrations
# 4. Run the seed script automatically
```

For production, manually drop and recreate tables, or use database backup/restore procedures.

## Best Practices

1. **Always run migrations before seeding**
2. **Test seed script locally before running on server**
3. **Backup production database before seeding**
4. **Review seed data before production deployment**
5. **Change default passwords immediately after seeding**
6. **Use environment variables for sensitive seed data**
7. **Document any custom seed data requirements**

## Additional Resources

- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/database/seed-database)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)


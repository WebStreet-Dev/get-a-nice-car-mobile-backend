# Coolify Deployment Guide

## Build Pack Selection

**Option 1: Docker Compose** (recommended if deploying database on the same server)
- Use this if you want Coolify to manage the database container

**Option 2: Dockerfile** (use this if database is hosted separately in Coolify)
- Use this if you already have a database resource created separately in Coolify
- You MUST set `DATABASE_URL` environment variable pointing to your database

## Required Environment Variables

Set these in Coolify's **Environment Variables** section:

### Database Configuration

**If using Docker Compose build pack:**
```env
DB_USER=nicecar_user
DB_PASSWORD=your_secure_password_here
DB_NAME=nicecar_db
```
**Note:** `DATABASE_URL` is automatically constructed from the above variables in docker-compose.yml.

**If using Dockerfile build pack with external database:**
```env
DATABASE_URL=postgresql://nicecar_user:your_secure_password_here@voskwkwco0ksoscg40008ko4:5432/postgres?schema=public
```
**Important:** Replace `voskwkwco0ksoscg40008ko4` with your actual database container hostname from Coolify. You can find this in your database resource's "Postgres URL (internal)" field.

### JWT Secrets (Required)
```env
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
```

### CORS Configuration (Required)
```env
CORS_ORIGIN=https://your-frontend-domain.com,https://your-admin-panel-domain.com
```

### Firebase Configuration (Required for Push Notifications)
```env
FIREBASE_PROJECT_ID=getanicecar
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@getanicecar.iam.gserviceaccount.com
```

**Important:** For `FIREBASE_PRIVATE_KEY`, keep the `\n` characters as they are (they represent newlines).

### SMTP Configuration (Optional - for emails)
```env
SMTP_FROM=noreply@getanicecar.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

## What Gets Deployed

When using Docker Compose build pack, the following services will be deployed:

1. **PostgreSQL Database** (internal, port 5432)
   - Database name: `nicecar_db` (or value from `DB_NAME`)
   - User: `nicecar_user` (or value from `DB_USER`)
   - Password: from `DB_PASSWORD`
   - Data persisted in Docker volume: `postgres_data`

2. **Redis Cache** (internal, port 6379)
   - Data persisted in Docker volume: `redis_data`

3. **Node.js API** (exposed, port 3000)
   - Automatically connects to PostgreSQL and Redis
   - Runs database migrations on startup
   - Health check endpoint: `/health`

4. **Admin Panel** (exposed, port 3001, if built)
   - Served by nginx
   - Requires building the React admin panel first

## Deployment Steps

1. **Select Build Pack**: Choose "Docker Compose"
2. **Set Repository**: `get-a-nice-car-mobile-backend`
3. **Set Branch**: `main`
4. **Set Environment Variables**: Add all required variables listed above
5. **Deploy**: Click deploy and wait for build to complete

## Post-Deployment

After successful deployment:

1. **Check Health**: Visit `http://your-domain/health` to verify API is running
2. **Database Setup**: Migrations run automatically on startup
3. **Seed Data** (Optional): If you want to seed initial data, you can run:
   ```bash
   docker exec -it <container_name> npm run db:seed
   ```

## Troubleshooting

### Database Connection Issues
- Ensure `DB_PASSWORD` is set correctly
- Check that PostgreSQL container is healthy
- Verify network connectivity between containers

### Migration Errors
- Check logs: `docker logs <api_container_name>`
- Ensure DATABASE_URL is correctly constructed
- Try running migrations manually: `docker exec -it <container_name> npx prisma migrate deploy`

### Build Failures
- Ensure all environment variables are set
- Check that Prisma schema file exists
- Verify Docker Compose file syntax


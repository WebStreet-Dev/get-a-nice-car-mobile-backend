# Start Local Development Environment

## Step 1: Start Docker Desktop

**Make sure Docker Desktop is running on your Mac!**

1. Open Docker Desktop application
2. Wait for it to fully start (whale icon in menu bar should be steady)
3. Verify it's running: Docker icon should be active in your menu bar

## Step 2: Start Database and Redis

Once Docker is running, start the database:

```bash
cd backend
docker-compose -f docker-compose.dev.yml up -d
```

This will start:
- **PostgreSQL** on port `5432`
- **pgAdmin** on port `5050` (optional - database admin UI)
- **Redis** on port `6379`

## Step 3: Verify Database is Running

```bash
docker-compose -f docker-compose.dev.yml ps
```

You should see all services as "Up".

## Step 4: Apply Database Schema

```bash
cd backend
npx prisma db push
```

This will create the `user_type` column and enum.

## Step 5: Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on: `http://localhost:3000`

## Step 6: Start Admin Panel

In a **new terminal**:

```bash
cd backend/admin
npm run dev
```

Admin panel will run on: `http://localhost:5173`

## Access Admin Panel

Open in browser:
```
http://localhost:5173
```

Login with:
- Email: `admin@getanicecar.com`
- Password: `admin123456`

## Quick Start Script

You can also run this to start everything:

```bash
# Terminal 1: Start Docker services
cd backend
docker-compose -f docker-compose.dev.yml up -d

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start admin panel
cd backend/admin
npm run dev
```

## Troubleshooting

### Docker not running
- Open Docker Desktop
- Wait for it to fully start
- Check menu bar for Docker icon

### Port already in use
- Check if services are already running: `docker-compose -f docker-compose.dev.yml ps`
- Stop existing: `docker-compose -f docker-compose.dev.yml down`
- Start again: `docker-compose -f docker-compose.dev.yml up -d`

### Database connection error
- Make sure Docker is running
- Check database is up: `docker ps | grep postgres`
- Verify DATABASE_URL in `.env` matches docker-compose settings

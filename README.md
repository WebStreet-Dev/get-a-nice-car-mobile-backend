# Nice Car Mobile Backend

Backend API for the Nice Car Mobile application built with Node.js, Express, TypeScript, and Prisma.

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Push Notifications**: Firebase Cloud Messaging

## Prerequisites

- Node.js 20+
- Docker Desktop (for local development)
- npm or yarn

## Quick Start

### 1. Start Docker Services

```bash
# Start PostgreSQL, pgAdmin, and Redis
npm run docker:up

# Check if services are running
docker-compose -f docker-compose.dev.yml ps
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

The `.env` file is already configured for local development. For production, update the values accordingly.

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (admin user, departments, FAQs)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npm run docker:logs` | View Docker logs |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create database migration |
| `npm run db:seed` | Seed initial data |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

When deploying a new version (e.g. after adding routes like device-token):

1. Pull the latest code.
2. Run `npm run build` so `dist/` includes all routes (e.g. `dist/routes/device-token.routes.js`).
3. If the Prisma schema changed: run **`npm run db:migrate:prod`** only. This applies pending migrations (e.g. creates new tables like `device_tokens`) and **does not modify or delete existing data**. Do **not** run `db:seed` or `db:push` in production—seeds can overwrite data; push can be destructive.
4. Restart the Node process so it runs the new `dist/app.js`.

If you see **404 for POST /api/v1/device-token**, the running server is likely using an old build; redeploy with the steps above and restart.

### Production: Image uploads (Cloudinary)

In **production**, image uploads (e.g. sales person photos) require **Cloudinary** so images persist across redeploys and restarts. Without Cloudinary, the server uses local disk and images are lost on redeploy.

Set these environment variables in production:

- `CLOUDINARY_CLOUD_NAME` – your Cloudinary cloud name
- `CLOUDINARY_API_KEY` – API key
- `CLOUDINARY_API_SECRET` – API secret
- `CLOUDINARY_FOLDER` – (optional) folder name, default `nicecar`

If these are not set in production, upload requests will fail with a 503 and a clear error message (no silent fallback to local storage). In development, local storage is still used when Cloudinary is not configured.

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout user
- `PUT /change-password` - Change password
- `GET /me` - Get current user

### Device token (`/api/v1/device-token`) – public, no auth
- `POST /` - Register FCM token for guest devices (broadcast to all app installs)

### Users (`/api/v1/users`)
- `GET /me` - Get profile
- `PUT /me` - Update profile
- `PUT /me/fcm-token` - Update FCM token
- `DELETE /me/fcm-token` - Remove FCM token

### Appointments (`/api/v1/appointments`)
- `POST /` - Create appointment
- `GET /` - List appointments
- `GET /:id` - Get appointment
- `PUT /:id` - Update appointment
- `DELETE /:id` - Cancel appointment

### Departments (`/api/v1/departments`)
- `GET /` - List departments
- `GET /:id` - Get department

### FAQs (`/api/v1/faqs`)
- `GET /` - List FAQs
- `GET /:id` - Get FAQ

### Breakdown (`/api/v1/breakdown`)
- `POST /` - Create breakdown request
- `GET /active` - Get active request
- `GET /:id` - Get request
- `PUT /:id/location` - Update location
- `DELETE /:id` - Cancel request

### Notifications (`/api/v1/notifications`)
- `GET /` - List notifications
- `PUT /read-all` - Mark all as read
- `PUT /:id/read` - Mark as read
- `DELETE /:id` - Delete notification

### Admin (`/api/v1/admin`)
- `GET /dashboard` - Dashboard stats
- `GET /clients` - List clients
- `PUT /clients/:id/toggle-status` - Toggle client status
- `GET /clients/pending` - Get pending clients
- `PUT /clients/:id/approve` - Approve client
- `PUT /clients/:id/reject` - Reject client
- `GET /employees` - List employees
- `POST /employees` - Create employee (Admin and Super Admin)
- `PUT /employees/:id` - Update employee
- `PUT /employees/:id/toggle-status` - Toggle employee status
- `PUT /employees/:id/role` - Change employee role (Super Admin only)
- `DELETE /employees/:id` - Delete employee
- `GET /appointments` - List all appointments
- `PUT /appointments/:id/status` - Update status
- `GET /departments` - List departments
- `POST /departments` - Create department
- `PUT /departments/:id` - Update department
- `DELETE /departments/:id` - Delete department
- `GET /faqs` - List FAQs
- `POST /faqs` - Create FAQ
- `PUT /faqs/:id` - Update FAQ
- `DELETE /faqs/:id` - Delete FAQ
- `GET /breakdown` - List breakdown requests
- `PUT /breakdown/:id/status` - Update status
- `POST /notifications/broadcast` - Send to all
- `POST /notifications/send` - Send to users

## Default Credentials

### Admin User
- Email: `admin@getanicecar.com`
- Password: `admin123456`

### Test User
- Email: `john.doe@example.com`
- Password: `test123456`

## Database Access

- **pgAdmin**: http://localhost:5050
  - Email: `admin@nicecar.com`
  - Password: `admin123`

## Project Structure

```
backend/
├── src/
│   ├── config/           # Environment configs
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Helpers
│   ├── validators/       # Zod schemas
│   └── app.ts            # Express app
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── docker-compose.dev.yml
├── package.json
└── tsconfig.json
```









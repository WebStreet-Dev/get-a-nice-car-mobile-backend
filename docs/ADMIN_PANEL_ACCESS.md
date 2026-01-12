# How to Access the Admin Panel CMS

## Overview
The admin panel is a React-based CMS located in `backend/admin/`. It provides a web interface for managing:
- Clients (formerly Users)
- Employees
- Appointments
- Departments
- FAQs
- Breakdown Requests
- Notifications
- Roles

## Access Methods

### Option 1: Build and Serve Locally (Development)

1. **Navigate to admin directory:**
   ```bash
   cd backend/admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access at:**
   ```
   http://localhost:5173
   ```

### Option 2: Build and Deploy to Coolify

#### Step 1: Build the Admin Panel

```bash
cd backend/admin
npm install
npm run build
```

This creates a `dist` folder with the built admin panel.

#### Step 2: Deploy to Coolify

You have two options:

**A. Create a separate static site service in Coolify:**
1. In Coolify, create a new "Static Site" service
2. Point it to the `backend/admin/dist` folder
3. Set the domain (e.g., `admin.yourdomain.com`)
4. Deploy

**B. Serve via the same domain with a subpath:**
- Configure nginx to serve `/admin` from the built files
- Or use a reverse proxy configuration

#### Step 3: Configure API URL

The admin panel uses relative API URLs (`/api/v1`), so it should work if:
- Admin panel is served from the same domain as the API
- Or API is accessible from the admin panel's domain

### Option 3: Using Docker Compose (Local/Production)

If using `docker-compose.yml`:

1. **Build admin panel:**
   ```bash
   cd backend/admin
   npm install
   npm run build
   ```

2. **Start services:**
   ```bash
   cd backend
   docker-compose up -d
   ```

3. **Access at:**
   ```
   http://localhost:3001
   ```

## Default Login Credentials

Based on the README, use:

- **Email:** `admin@getanicecar.com`
- **Password:** `admin123456`

## Admin Panel Features

Once logged in, you can access:

- **Dashboard** - Overview statistics
- **Clients** - Manage client accounts (approve/reject)
- **Employees** - Create and manage employees
- **Appointments** - View and manage appointments
- **Departments** - Manage departments
- **FAQs** - Manage frequently asked questions
- **Breakdown** - Manage breakdown requests
- **Notifications** - Send notifications
- **Roles** - Manage custom roles

## Troubleshooting

### Admin Panel Not Loading

1. **Check if built:**
   ```bash
   ls backend/admin/dist
   ```
   Should show `index.html` and other assets

2. **Check API connection:**
   - Open browser console (F12)
   - Check for API errors
   - Verify API URL is correct

3. **Check CORS:**
   - Ensure admin panel domain is in `CORS_ORIGIN` environment variable

### Login Not Working

1. **Verify credentials:**
   - Use: `admin@getanicecar.com` / `admin123456`
   - Or check database for actual admin user

2. **Check API endpoint:**
   - Test `/api/v1/auth/login` in Postman first
   - Verify it returns a token

3. **Check browser console:**
   - Look for network errors
   - Check if token is being stored in localStorage

## Quick Setup for Coolify

If you want to quickly set up the admin panel in Coolify:

1. **Build locally or in CI:**
   ```bash
   cd backend/admin
   npm install
   npm run build
   ```

2. **Commit the dist folder** (or use a build step in Coolify)

3. **Create Static Site service in Coolify:**
   - Type: Static Site
   - Source: Your repository
   - Build Command: `cd admin && npm install && npm run build`
   - Publish Directory: `admin/dist`
   - Domain: `admin.yourdomain.com` or subpath

4. **Configure environment:**
   - Ensure API is accessible from admin domain
   - Set CORS_ORIGIN to include admin domain

## Current Status

Based on your setup, the admin panel code exists but may need to be:
1. ✅ Built (`npm run build` in `backend/admin`)
2. ✅ Deployed as a separate service or static site
3. ✅ Configured to access your API at `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io`

Would you like me to help you set up the admin panel deployment in Coolify?

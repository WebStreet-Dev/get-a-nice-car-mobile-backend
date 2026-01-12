# Build and Deploy Admin Panel

## Current Status
✅ Admin panel code exists in `backend/admin/`  
❌ Admin panel is NOT built (no `dist` folder)  
❌ Admin panel is NOT deployed  

## Quick Setup

### Option 1: Build and Serve from Backend (Recommended)

This will serve the admin panel from the same domain as your API.

#### Step 1: Build Admin Panel

```bash
cd backend/admin
npm install
npm run build
```

This creates a `dist` folder with the built files.

#### Step 2: Update Backend to Serve Admin Panel

Add static file serving to `backend/src/app.ts`:

```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve admin panel static files (before API routes)
app.use(express.static(path.join(__dirname, '../admin/dist')));

// API routes
app.use('/api/v1/auth', authLimiter, authRoutes);
// ... rest of routes

// Fallback to admin panel for non-API routes
app.get('*', (req, res, next) => {
  // Don't serve admin panel for API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../admin/dist/index.html'));
});
```

#### Step 3: Deploy

After building and updating the code:
1. Commit changes
2. Push to repository
3. Coolify will auto-deploy

#### Step 4: Access

After deployment, access at:
```
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io
```

Login with:
- Email: `admin@getanicecar.com`
- Password: `admin123456`

### Option 2: Separate Static Site in Coolify

1. Build admin panel locally:
   ```bash
   cd backend/admin
   npm install
   npm run build
   ```

2. In Coolify, create a new "Static Site" service
3. Point to `backend/admin/dist` folder
4. Set domain or subdomain
5. Configure API URL if needed

## Admin Panel Features

The admin panel has a sidebar with:
- 📊 **Dashboard** - Overview statistics
- 👥 **Users** - Manage clients (now shows "Clients")
- 📅 **Appointments** - Manage appointments
- 🏢 **Departments** - Manage departments
- ❓ **FAQs** - Manage FAQs
- 🚗 **Breakdown** - Manage breakdown requests
- 🔔 **Notifications** - Send notifications
- 🔐 **Roles** - Manage custom roles (Super Admin only)

## Update Admin Panel for Clients/Employees

**Note:** The admin panel still uses old endpoints (`/admin/users`). You'll need to update it to use:
- `/admin/clients` instead of `/admin/users`
- `/admin/employees` for employee management

Would you like me to:
1. Update the backend to serve the admin panel?
2. Update the admin panel code to use the new `/clients` and `/employees` endpoints?

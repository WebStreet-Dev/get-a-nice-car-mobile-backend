# Deploy Client/Employee Changes to Coolify

## Issue
The `/api/v1/admin/clients` endpoint returns 404 because the code changes haven't been deployed yet.

## Steps to Deploy

### 1. Commit Your Changes
Make sure all changes are committed:

```bash
git add .
git commit -m "feat: Change Users to Clients and add Employee management"
git push
```

### 2. Deploy in Coolify

**Option A: Automatic Deployment (if connected to Git)**
- Coolify should automatically detect the push and redeploy
- Check the Coolify dashboard for deployment status

**Option B: Manual Deployment**
1. Go to your Coolify dashboard
2. Navigate to your backend application
3. Click "Redeploy" or "Deploy Latest"
4. Wait for the build to complete

### 3. Verify Deployment

After deployment, test the endpoints:

```bash
# Test clients endpoint
GET http://your-api-url/api/v1/admin/clients
Authorization: Bearer <your-token>

# Test employees endpoint  
GET http://your-api-url/api/v1/admin/employees
Authorization: Bearer <your-token>
```

## What Gets Deployed

The deployment will:
1. ✅ Pull latest code from Git
2. ✅ Install dependencies (`npm ci`)
3. ✅ Generate Prisma Client (`npx prisma generate`)
4. ✅ Build TypeScript (`npm run build`)
5. ✅ Start the server with new routes

## Expected Routes After Deployment

### Clients
- `GET /api/v1/admin/clients`
- `GET /api/v1/admin/clients/pending`
- `PUT /api/v1/admin/clients/:id/approve`
- `PUT /api/v1/admin/clients/:id/reject`
- `PUT /api/v1/admin/clients/:id/toggle-status`

### Employees
- `GET /api/v1/admin/employees`
- `POST /api/v1/admin/employees`
- `PUT /api/v1/admin/employees/:id`
- `PUT /api/v1/admin/employees/:id/toggle-status`
- `PUT /api/v1/admin/employees/:id/role`
- `DELETE /api/v1/admin/employees/:id`

## Troubleshooting

### If 404 persists after deployment:

1. **Check build logs** in Coolify:
   - Look for TypeScript compilation errors
   - Check if Prisma Client generated successfully

2. **Verify routes are registered**:
   ```bash
   # Check server logs for route registration
   # Should see: "Registering admin routes at /api/v1/admin"
   ```

3. **Check authentication**:
   - Make sure you're sending a valid Bearer token
   - Token should be for an ADMIN or SUPER_ADMIN user

4. **Restart the application**:
   - Sometimes a simple restart fixes route registration issues

### If build fails:

1. **Check Prisma schema**:
   ```bash
   npx prisma validate
   ```

2. **Check TypeScript compilation**:
   ```bash
   npm run build
   ```

3. **Check dependencies**:
   ```bash
   npm ci
   ```

## Quick Deployment Checklist

- [ ] All code changes committed
- [ ] Changes pushed to Git repository
- [ ] Coolify connected to repository (or manual deploy triggered)
- [ ] Build completed successfully
- [ ] Server restarted
- [ ] Tested `/api/v1/admin/clients` endpoint
- [ ] Tested `/api/v1/admin/employees` endpoint

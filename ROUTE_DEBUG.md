# Route Debugging Guide

## Issue
All admin routes returning 404 in Postman and Flutter app.

## Routes Defined

All routes are correctly defined in `backend/src/routes/admin.routes.ts`:

1. **GET** `/api/v1/admin/users` - Line 48
2. **GET** `/api/v1/admin/appointments` - Line 99
3. **GET** `/api/v1/admin/departments` - Line 129
4. **GET** `/api/v1/admin/faqs` - Line 159
5. **GET** `/api/v1/admin/downpayment` - Line 221
6. **GET** `/api/v1/admin/breakdown` - Line 189
7. **GET** `/api/v1/admin/roles` - Line 289

## Route Registration

Routes are registered in `backend/src/app.ts` at line 85:
```typescript
app.use('/api/v1/admin', adminRoutes);
```

## Authentication

All admin routes require:
1. **Bearer Token** in Authorization header
2. **Admin or Super Admin role**

## Testing Steps

### 1. Test Without Auth (Should return 401, not 404)
```bash
GET http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/users
```

Expected: 401 Unauthorized (if route exists)
If 404: Route not being matched

### 2. Test With Auth
```bash
GET http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/users
Headers:
  Authorization: Bearer <valid-admin-token>
```

Expected: 200 OK with user list

### 3. Test Test Route (No Auth Required)
```bash
GET http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/test
```

Expected: 200 OK with test message
If 404: Router not being registered

## Debugging Checklist

- [ ] Server is running (`npm run dev` or `npm start`)
- [ ] Routes file is compiled (check `dist/routes/admin.routes.js` exists)
- [ ] Check server logs for "Registering admin routes" message
- [ ] Check server logs for "Admin route hit" messages
- [ ] Verify authentication token is valid
- [ ] Verify user has ADMIN or SUPER_ADMIN role
- [ ] Check if routes are being matched (look for route attempt logs)

## Common Issues

1. **404 on all routes**: Routes not registered or server not restarted
2. **401 on all routes**: Authentication failing (expected if no token)
3. **403 on all routes**: User doesn't have admin role
4. **Routes work in code but not in Postman**: CORS or server not running

## Next Steps

1. Restart the backend server
2. Check server logs when making requests
3. Test the `/api/v1/admin/test` route first (no auth required)
4. Then test with authentication

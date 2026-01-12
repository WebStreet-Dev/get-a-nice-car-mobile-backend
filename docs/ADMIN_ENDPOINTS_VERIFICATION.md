# Admin Endpoints Verification

## Base URL
All admin endpoints are registered under: `/api/v1/admin`

## Verified Endpoints

### ✅ USERS (PLURAL - `/users`)
- **GET** `/api/v1/admin/users` - Get all users
- **GET** `/api/v1/admin/users/pending` - Get pending users
- **PUT** `/api/v1/admin/users/:id/toggle-status` - Toggle user status
- **PUT** `/api/v1/admin/users/:id/role` - Change user role
- **PUT** `/api/v1/admin/users/:id/approve` - Approve user
- **PUT** `/api/v1/admin/users/:id/reject` - Reject user
- **POST** `/api/v1/admin/users/create-internal` - Create internal user
- **POST** `/api/v1/admin/users/:id/assign-role` - Assign role to user
- **DELETE** `/api/v1/admin/users/:id/role` - Remove role from user

### ✅ APPOINTMENTS (PLURAL - `/appointments`)
- **GET** `/api/v1/admin/appointments` - Get all appointments
- **PUT** `/api/v1/admin/appointments/:id/status` - Update appointment status
- **PUT** `/api/v1/admin/appointments/:id/approve` - Approve appointment
- **PUT** `/api/v1/admin/appointments/:id/reject` - Reject appointment

### ✅ DEPARTMENTS (PLURAL - `/departments`)
- **GET** `/api/v1/admin/departments` - Get all departments
- **POST** `/api/v1/admin/departments` - Create department
- **PUT** `/api/v1/admin/departments/:id` - Update department
- **DELETE** `/api/v1/admin/departments/:id` - Delete department

### ✅ FAQs (PLURAL - `/faqs`)
- **GET** `/api/v1/admin/faqs` - Get all FAQs
- **POST** `/api/v1/admin/faqs` - Create FAQ
- **PUT** `/api/v1/admin/faqs/:id` - Update FAQ
- **DELETE** `/api/v1/admin/faqs/:id` - Delete FAQ

### ✅ DOWNPAYMENT (SINGULAR - `/downpayment`)
- **GET** `/api/v1/admin/downpayment` - Get all downpayment categories
- **POST** `/api/v1/admin/downpayment` - Create downpayment category
- **PUT** `/api/v1/admin/downpayment/:id` - Update downpayment category
- **PUT** `/api/v1/admin/downpayment/:id/toggle` - Toggle category status
- **DELETE** `/api/v1/admin/downpayment/:id` - Delete downpayment category

### ✅ BREAKDOWN (SINGULAR - `/breakdown`)
- **GET** `/api/v1/admin/breakdown` - Get all breakdown requests
- **PUT** `/api/v1/admin/breakdown/:id/status` - Update breakdown status

### ✅ ROLES (PLURAL - `/roles`)
- **GET** `/api/v1/admin/roles` - Get all roles
- **GET** `/api/v1/admin/roles/:id` - Get role by ID
- **POST** `/api/v1/admin/roles` - Create role
- **PUT** `/api/v1/admin/roles/:id` - Update role
- **DELETE** `/api/v1/admin/roles/:id` - Delete role

### ✅ DASHBOARD
- **GET** `/api/v1/admin/dashboard` - Get dashboard statistics

## Route Registration
Routes are registered in `backend/src/app.ts`:
```typescript
app.use('/api/v1/admin', adminRoutes);
```

## Important Notes

1. **All routes use PLURAL forms** except:
   - `/downpayment` (singular)
   - `/breakdown` (singular)

2. **Authentication Required**: All admin routes require:
   - Authentication token (Bearer token)
   - Admin or Super Admin role

3. **Route Order**: Routes are registered before the `notFoundHandler` in `app.ts`

4. **Middleware**: All admin routes go through:
   - `authenticate` middleware (verifies JWT token)
   - `adminOnly` middleware (verifies admin role)

## Testing

To test in Postman, use:
- **URL**: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/users` (note: **users** plural, not **user**)
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer <your-token>`
  - `Content-Type: application/json`

## Common Issues

1. **404 Error**: 
   - Check if using singular form (e.g., `/user` instead of `/users`)
   - Verify authentication token is included
   - Ensure server is running and routes are compiled

2. **401 Error**: 
   - Token missing or invalid
   - Token expired

3. **403 Error**: 
   - User doesn't have admin role

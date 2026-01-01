# Migration Guide: Users to Clients + Employees

## Overview
This migration changes the system from a single "Users" concept to separate "Clients" and "Employees":
- **Clients**: Regular customers who register through the app
- **Employees**: Staff members created by admins

## Database Changes

### 1. Run Prisma Migration

```bash
cd backend
npx prisma migrate dev --name add_user_type
```

This will:
- Add `UserType` enum (CLIENT, EMPLOYEE)
- Add `user_type` column to `users` table
- Set existing users as CLIENT
- Set existing ADMIN/SUPER_ADMIN as EMPLOYEE

### 2. Regenerate Prisma Client

```bash
npx prisma generate
```

## API Changes

### Old Endpoints (Deprecated)
- `GET /api/v1/admin/users` → Use `/api/v1/admin/clients`
- `GET /api/v1/admin/users/pending` → Use `/api/v1/admin/clients/pending`
- `PUT /api/v1/admin/users/:id/approve` → Use `/api/v1/admin/clients/:id/approve`
- `PUT /api/v1/admin/users/:id/reject` → Use `/api/v1/admin/clients/:id/reject`
- `PUT /api/v1/admin/users/:id/toggle-status` → Use `/api/v1/admin/clients/:id/toggle-status`
- `POST /api/v1/admin/users/create-internal` → Use `/api/v1/admin/employees`

### New Endpoints

#### Clients
- `GET /api/v1/admin/clients` - List all clients
- `GET /api/v1/admin/clients/pending` - Get pending clients
- `PUT /api/v1/admin/clients/:id/approve` - Approve client
- `PUT /api/v1/admin/clients/:id/reject` - Reject client
- `PUT /api/v1/admin/clients/:id/toggle-status` - Toggle client status

#### Employees
- `GET /api/v1/admin/employees` - List all employees
- `POST /api/v1/admin/employees` - Create employee (Admin and Super Admin)
- `PUT /api/v1/admin/employees/:id` - Update employee
- `PUT /api/v1/admin/employees/:id/toggle-status` - Toggle employee status
- `PUT /api/v1/admin/employees/:id/role` - Change employee role (Super Admin only)
- `DELETE /api/v1/admin/employees/:id` - Delete employee

## Flutter App Changes

### Screen Names
- `AdminUsersScreen` → `AdminClientsScreen`
- `AdminCreateUserScreen` → `AdminCreateEmployeeScreen`

### Routes
- `/admin/users` → `/admin/clients`
- `/admin/users/create` → `/admin/employees/create`

### Provider Methods
- `getPendingUsers()` → `getPendingClients()`
- `approveUser()` → `approveClient()`
- `rejectUser()` → `rejectClient()`
- `toggleUserStatus()` → `toggleClientStatus()`
- `createInternalUser()` → `createEmployee()`

## User Registration

- Public registration (`POST /api/v1/auth/register`) creates **CLIENTS** only
- Employees are created by admins via `POST /api/v1/admin/employees`
- Both ADMIN and SUPER_ADMIN can create employees (previously only SUPER_ADMIN)

## Testing

1. **Test Client Registration:**
   ```
   POST /api/v1/auth/register
   ```
   Should create user with `userType: CLIENT`

2. **Test Employee Creation:**
   ```
   POST /api/v1/admin/employees
   Authorization: Bearer <admin-token>
   ```
   Should create user with `userType: EMPLOYEE`

3. **Test Client Endpoints:**
   ```
   GET /api/v1/admin/clients
   GET /api/v1/admin/clients/pending
   ```

4. **Test Employee Endpoints:**
   ```
   GET /api/v1/admin/employees
   POST /api/v1/admin/employees
   ```

## Backward Compatibility

- Old `/admin/users` endpoints are deprecated but may still work temporarily
- Dashboard now returns `totalClients` instead of `totalUsers`
- Flutter app has deprecated methods that call new methods for compatibility

## Important Notes

1. **Database**: The `users` table name remains unchanged (to avoid breaking relations)
2. **Relations**: All `userId` references in appointments, breakdowns, etc. still point to `users` table
3. **Existing Data**: All existing users are set as CLIENT by default, except ADMIN/SUPER_ADMIN which are set as EMPLOYEE

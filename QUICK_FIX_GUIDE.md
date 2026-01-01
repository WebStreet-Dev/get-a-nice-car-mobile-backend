# Quick Fix Guide - PostgreSQL Password Mismatch

## The Problem
Your `DATABASE_URL` has a different password than what PostgreSQL actually uses (stored in Docker volume).

## Fastest Solution (5 minutes)

### Step 1: Delete Database with Volumes
1. Go to database page in Coolify
2. **Danger Zone** → **Delete**
3. ✅ **Check "Delete volumes"** (critical!)
4. Confirm

### Step 2: Recreate Database
1. Create new PostgreSQL
2. Set password: `1234567890` (or your choice - **remember it!**)
3. Username: `postgres`
4. Database: `postgres`
5. Save

### Step 3: Update DATABASE_URL
1. Go to Application → Environment Variables
2. Find `DATABASE_URL`
3. Update to: `postgres://postgres:1234567890@<NEW_SERVICE_ID>:5432/postgres`
   - Replace `<NEW_SERVICE_ID>` with actual service ID from database config
   - Replace `1234567890` with your actual password
4. ✅ Check **"Available at Runtime"**
5. Save

### Step 4: Redeploy
1. Application page → **Redeploy** (not restart)
2. Wait for completion

### Step 5: Test
```
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/departments
```

Should return: `{"success": true, "data": [...]}`

---

## Alternative: Reset Password (If you know original password)

1. Database → Terminal
2. `psql -U postgres` (enter original password)
3. `ALTER USER postgres WITH PASSWORD '1234567890';`
4. `\q`
5. Update `DATABASE_URL` with new password
6. Redeploy backend

---

## Why This Happens
PostgreSQL only reads credentials **on first container start**. They're stored in Docker volume and can't be changed via Coolify UI.




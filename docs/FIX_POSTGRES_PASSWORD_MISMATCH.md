# Fix PostgreSQL Password Mismatch - Complete Guide

## Problem
PostgreSQL credentials are set **ONLY on first container start** and stored in Docker volumes. Changing them in Coolify UI has **NO EFFECT**.

**Error**: `Authentication failed against database server`

## Root Cause
- Database password stored in Docker volume ≠ Password in `DATABASE_URL`
- PostgreSQL only reads credentials on first initialization
- Changing credentials in Coolify UI doesn't update the database

## Solution: Choose One Option

---

## ✅ Option A: Delete & Recreate Database (Recommended for Dev/Test)

**Best for**: Development, testing, or when you don't need to keep existing data

### Steps:

1. **Stop Backend Application**
   - Go to: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/application/q8k0w4kggcw0ks4cooskcwss`
   - Click **"Stop"** button

2. **Delete Database**
   - Go to: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/database/lwgk444swsk0sos4gkw4okgk`
   - Scroll to **"Danger Zone"** section
   - Click **"Delete"** button
   - ✅ **CRITICAL**: Check **"Delete volumes"** checkbox
   - Confirm deletion

3. **Recreate PostgreSQL Database**
   - Click **"+ Add Resource"** or **"New Resource"**
   - Select **"PostgreSQL"**
   - Configure with **FINAL credentials**:
     - **Username**: `postgres`
     - **Password**: `1234567890` (or your chosen password - **remember this!**)
     - **Database**: `postgres`
     - **Image**: `postgres:17-alpine` (or latest)
   - ⚠️ **IMPORTANT**: These credentials are **FINAL** - you cannot change them later without deleting volumes
   - Click **"Save"** or **"Create"**

4. **Wait for Database to Start**
   - Check that database status is **"Running"**
   - Note the **Service ID** (hostname) - it might be different from `lwgk444swsk0sos4gkw4okgk`

5. **Get Database Connection URL**
   - In database configuration, go to **"Network"** section
   - Find **"Postgres URL (internal)"** field
   - Copy this URL - it should look like:
     ```
     postgres://postgres:1234567890@<SERVICE_ID>:5432/postgres
     ```

6. **Update DATABASE_URL in Application**
   - Go to: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/application/q8k0w4kggcw0ks4cooskcwss/environment-variables`
   - Find `DATABASE_URL`
   - Click **"Update"**
   - Set value to the URL from step 5:
     ```
     postgres://postgres:1234567890@<NEW_SERVICE_ID>:5432/postgres
     ```
   - ✅ Ensure **"Available at Runtime"** is checked
   - Click **"Update"**

7. **Redeploy Backend**
   - Go back to application main page
   - Click **"Redeploy"** (NOT just "Restart")
   - Wait for deployment to complete

8. **Verify Connection**
   - Check application logs for successful database connection
   - Test API: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/departments`
   - Expected: `{"success": true, "data": [...]}`

---

## ✅ Option B: Reset Password Inside PostgreSQL (Keep Data)

**Best for**: Production or when you need to keep existing data

**Prerequisites**: You must know the **original database password** to log in

### Steps:

1. **Get Original Password**
   - Check if you have the original password saved somewhere
   - Or check the original `DATABASE_URL` if it was working before

2. **Access PostgreSQL Terminal**
   - Go to: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/database/lwgk444swsk0sos4gkw4okgk`
   - Click **"Terminal"** tab
   - Or use the terminal button in the database interface

3. **Login to PostgreSQL**
   ```bash
   psql -U postgres
   ```
   - If it asks for password, enter the **original password**
   - If login fails → You don't have the original password → Use **Option A** instead

4. **Reset Password**
   Once logged in, run:
   ```sql
   ALTER USER postgres WITH PASSWORD '1234567890';
   ```
   - Replace `1234567890` with your desired new password
   - Press Enter
   - You should see: `ALTER ROLE`

5. **Exit PostgreSQL**
   ```sql
   \q
   ```

6. **Update DATABASE_URL**
   - Go to: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/application/q8k0w4kggcw0ks4cooskcwss/environment-variables`
   - Find `DATABASE_URL`
   - Click **"Update"**
   - Update password in URL:
     ```
     postgres://postgres:1234567890@lwgk444swsk0sos4gkw4okgk:5432/postgres
     ```
   - Replace `1234567890` with the new password you set in step 4
   - ✅ Ensure **"Available at Runtime"** is checked
   - Click **"Update"**

7. **Restart Database** (Optional but recommended)
   - Go back to database page
   - Click **"Restart"**

8. **Redeploy Backend**
   - Go to application page
   - Click **"Redeploy"**
   - Wait for deployment

9. **Verify Connection**
   - Check logs
   - Test API endpoint

---

## 🔍 Verification Steps

### Test Database Connection from Backend Container

1. Go to application → **Terminal** tab
2. Run:
   ```bash
   # Check if DATABASE_URL is set
   echo $DATABASE_URL
   
   # Install postgresql client
   apk add --no-cache postgresql-client
   
   # Test connection
   psql "$DATABASE_URL" -c "SELECT version();"
   ```

3. **Expected Success Output**:
   ```
   PostgreSQL 17.x on x86_64...
   ```

4. **Expected Failure Output** (if password wrong):
   ```
   psql: error: connection to server ... failed: FATAL: password authentication failed
   ```

### Test from Application Logs

Check application logs for:
- ✅ `Prisma connection test succeeded`
- ✅ `Database setup completed`
- ❌ `Authentication failed`
- ❌ `Can't reach database server`

---

## 📋 Configuration Checklist

After fixing, verify:

- [ ] Database is running and healthy
- [ ] `DATABASE_URL` matches database credentials exactly:
  - [ ] Username matches
  - [ ] Password matches (character-by-character)
  - [ ] Hostname is Service ID (not display name)
  - [ ] Port is `5432`
  - [ ] Database name matches
- [ ] `DATABASE_URL` has **"Available at Runtime"** checked
- [ ] Backend has been **Redeployed** (not just restarted)
- [ ] API endpoint returns data successfully

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Not Deleting Volumes
- **Problem**: Old credentials still in volume
- **Fix**: Always check **"Delete volumes"** when deleting database

### ❌ Mistake 2: Wrong Hostname
- **Problem**: Using display name instead of Service ID
- **Fix**: Use Service ID from "Postgres URL (internal)" field

### ❌ Mistake 3: Password Special Characters
- **Problem**: Special characters not URL-encoded
- **Fix**: URL-encode special characters:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

### ❌ Mistake 4: Not Redeploying
- **Problem**: Environment variables not reloaded
- **Fix**: Use **"Redeploy"**, not "Restart"

### ❌ Mistake 5: Changing Password in Coolify UI
- **Problem**: Doesn't update actual database
- **Fix**: Use Option A or Option B above

---

## 📝 Database URL Format

```
postgres://[USERNAME]:[PASSWORD]@[SERVICE_ID]:[PORT]/[DATABASE]
```

**Example**:
```
postgres://postgres:1234567890@lwgk444swsk0sos4gkw4okgk:5432/postgres
```

**Important**:
- Use **Service ID** as hostname (found in "Postgres URL (internal)")
- Password must match **exactly** (character-by-character)
- URL-encode special characters in password

---

## 🎯 Quick Reference

**Database Service ID**: `lwgk444swsk0sos4gkw4okgk`  
**Application Service ID**: `q8k0w4kggcw0ks4cooskcwss`  
**Network**: `coolify`  
**Port**: `5432`

**Key Takeaway**: PostgreSQL credentials are **immutable** once the volume is created. Always decide final credentials before first start, or delete the volume.

---

## ✅ After Fixing

Once everything works:
1. ✅ Document the final password securely
2. ✅ Enable Coolify database backups
3. ✅ Add Prisma migrations and seed scripts
4. ✅ Lock down PostgreSQL (no public exposure)
5. ✅ Test all API endpoints





# Coolify Database Configuration Verification Checklist

## Current Issue
API endpoint `/api/v1/departments` returns:
```json
{
    "success": false,
    "error": "Database error"
}
```

## Root Cause Analysis
Based on the ChatGPT debugging transcript, the issue is likely:
- **PostgreSQL credentials mismatch**: The database password stored in the Docker volume doesn't match the password in `DATABASE_URL`

## Verification Steps

### 1. Database Configuration (PostgreSQL Service)
**Location**: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/database/lwgk444swsk0sos4gkw4okgk`

**Check:**
- [ ] **Username**: Should be `postgres` (or check what's actually set)
- [ ] **Password**: Note the actual password value (hidden in UI, check in database terminal)
- [ ] **Database Name**: Should be `postgres` (or check what's actually set)
- [ ] **Service ID (Hostname)**: `lwgk444swsk0sos4gkw4okgk` ✅ (confirmed)
- [ ] **Port**: `5432` ✅ (confirmed)
- [ ] **Postgres URL (internal)**: Check the displayed value in the "Network" section

**Expected Postgres URL format:**
```
postgres://postgres:PASSWORD@lwgk444swsk0sos4gkw4okgk:5432/postgres
```

### 2. Application Environment Variables
**Location**: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/application/q8k0w4kggcw0ks4cooskcwss/environment-variables`

**Check:**
- [ ] **DATABASE_URL**: Verify the exact value
  - Format: `postgres://USERNAME:PASSWORD@HOSTNAME:5432/DATABASE`
  - Hostname MUST be: `lwgk444swsk0sos4gkw4okgk` (service ID, not display name)
  - Username MUST match database username exactly
  - Password MUST match database password exactly (character-by-character)
  - Database name MUST match

**Common Issues:**
- ❌ Wrong hostname (using display name instead of service ID)
- ❌ Password mismatch (different password in DATABASE_URL vs database)
- ❌ Username mismatch
- ❌ Special characters in password not URL-encoded

### 3. Cross-Verification Checklist

**Critical Matching Points:**
1. [ ] Database Username = DATABASE_URL Username
2. [ ] Database Password = DATABASE_URL Password (exact match)
3. [ ] Database Name = DATABASE_URL Database Name
4. [ ] Hostname = `lwgk444swsk0sos4gkw4okgk` (service ID)
5. [ ] Port = `5432`

### 4. Testing Database Connection

**From Backend Container Terminal:**
```bash
# Install postgresql-client if needed
apk add --no-cache postgresql-client

# Test connection using DATABASE_URL from environment
psql "$DATABASE_URL" -c "SELECT version();"
```

**Expected Result:**
```
PostgreSQL 17.x on x86_64...
```

**If Authentication Fails:**
- Password in DATABASE_URL doesn't match database password
- Username doesn't match

### 5. Solution Options

#### Option A: Delete and Recreate Database (Recommended for Dev/Test)
1. Go to PostgreSQL service → Danger Zone
2. Click "Delete"
3. ✅ **Check "Delete volumes"** (critical!)
4. Confirm deletion
5. Recreate PostgreSQL with FINAL credentials:
   - Username: `postgres`
   - Password: `1234567890` (or your chosen password)
   - Database: `postgres`
6. Update `DATABASE_URL` in application to match:
   ```
   DATABASE_URL=postgres://postgres:1234567890@lwgk444swsk0sos4gkw4okgk:5432/postgres
   ```
7. Redeploy backend application

#### Option B: Reset Password Inside PostgreSQL (If you know original password)
1. Open PostgreSQL → Terminal in Coolify
2. Login: `psql -U postgres`
3. Reset password: `ALTER USER postgres WITH PASSWORD '1234567890';`
4. Update `DATABASE_URL` in application to match
5. Restart database
6. Redeploy backend

### 6. Verification After Fix

1. Check backend logs for successful connection
2. Test API endpoint: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/departments`
3. Expected response:
   ```json
   {
     "success": true,
     "data": [...]
   }
   ```

## Important Notes

- **PostgreSQL credentials are immutable** once the Docker volume is created
- Changing credentials in Coolify UI does NOT update the database
- The service ID (`lwgk444swsk0sos4gkw4okgk`) is the correct hostname, NOT the display name
- Password special characters must be URL-encoded in DATABASE_URL
- Always verify credentials match character-by-character

## Current Configuration Summary

**Database Service ID**: `lwgk444swsk0sos4gkw4okgk` ✅  
**Application Service ID**: `q8k0w4kggcw0ks4cooskcwss` ✅  
**Network**: Both should be on `coolify` network ✅

**Next Steps:**
1. Verify actual database password (check in database terminal or recreate)
2. Verify DATABASE_URL matches exactly
3. Redeploy backend after fixing





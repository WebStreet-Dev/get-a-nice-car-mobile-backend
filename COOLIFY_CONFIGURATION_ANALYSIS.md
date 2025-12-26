# Coolify Configuration Analysis & Fix Guide

## Current Status
- **API Endpoint**: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/departments`
- **Error**: `{"success": false, "error": "Database error"}`
- **Root Cause**: Database connection/authentication failure

## Configuration Analysis

### ✅ Code Review Results
1. **Dockerfile**: No hardcoded credentials - uses environment variables ✅
2. **Backend Code**: Uses `process.env.DATABASE_URL` - no hardcoded values ✅
3. **Prisma Schema**: Uses `env("DATABASE_URL")` - correct ✅

### 🔍 Coolify Configuration Check

#### Database Service
- **Service ID**: `lwgk444swsk0sos4gkw4okgk` ✅
- **URL**: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/database/lwgk444swsk0sos4gkw4okgk`
- **Image**: `postgres:17-alpine` ✅
- **Port Mapping**: `3000:5432` (host:container)
- **Username**: Appears to be `postgres` (default)
- **Password**: ⚠️ **NEEDS VERIFICATION** (hidden in UI)
- **Database Name**: Appears to be `postgres` (default)

#### Application Service
- **Service ID**: `q8k0w4kggcw0ks4cooskcwss` ✅
- **URL**: `http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/application/q8k0w4kggcw0ks4cooskcwss`
- **DATABASE_URL**: ⚠️ **NEEDS VERIFICATION** (value not visible in browser)

## Critical Verification Steps

### Step 1: Get Database Password
**Option A - From Database Terminal:**
1. Go to PostgreSQL service in Coolify
2. Click "Terminal" tab
3. Run: `psql -U postgres`
4. If you can login, the password is correct
5. To check current password hash: `SELECT * FROM pg_shadow WHERE usename = 'postgres';`

**Option B - From Database Configuration:**
1. Go to PostgreSQL → General tab
2. Check the "Password" field (may be hidden)
3. Note the exact value

### Step 2: Get DATABASE_URL Value
1. Go to Application → Environment Variables
2. Find `DATABASE_URL`
3. Click "Update" or view the value
4. Copy the exact value

### Step 3: Verify Match
Compare these values character-by-character:

**Database Configuration:**
- Username: `postgres` (or actual value)
- Password: `[ACTUAL_PASSWORD]`
- Hostname: `lwgk444swsk0sos4gkw4okgk`
- Port: `5432`
- Database: `postgres`

**DATABASE_URL Format:**
```
postgres://[USERNAME]:[PASSWORD]@[HOSTNAME]:5432/[DATABASE]
```

**Expected:**
```
postgres://postgres:[PASSWORD]@lwgk444swsk0sos4gkw4okgk:5432/postgres
```

### Step 4: Common Issues to Check

#### ❌ Issue 1: Password Mismatch
**Symptom**: Authentication failed
**Cause**: Password in DATABASE_URL ≠ Database password
**Fix**: 
- Option A: Delete database and recreate with matching password
- Option B: Reset password in database to match DATABASE_URL

#### ❌ Issue 2: Wrong Hostname
**Symptom**: Can't reach database server
**Cause**: Using display name instead of service ID
**Fix**: Use service ID `lwgk444swsk0sos4gkw4okgk` (not display name)

#### ❌ Issue 3: Special Characters Not URL-Encoded
**Symptom**: Authentication failed
**Cause**: Special characters in password not encoded
**Fix**: URL-encode special characters:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- etc.

#### ❌ Issue 4: Username Mismatch
**Symptom**: Authentication failed
**Cause**: Username in DATABASE_URL ≠ Database username
**Fix**: Ensure both use `postgres` (or match exactly)

## Recommended Solution

### Quick Fix (If you know the original password)

1. **Get Current Database Password:**
   - Go to PostgreSQL → Terminal
   - Try to login: `psql -U postgres`
   - If successful, note the password

2. **Update DATABASE_URL:**
   - Go to Application → Environment Variables
   - Update `DATABASE_URL` to match:
     ```
     postgres://postgres:[CURRENT_PASSWORD]@lwgk444swsk0sos4gkw4okgk:5432/postgres
     ```
   - Replace `[CURRENT_PASSWORD]` with actual password
   - URL-encode special characters if needed

3. **Redeploy Backend:**
   - Go to Application → Click "Redeploy"
   - Wait for deployment to complete

4. **Test:**
   - Check logs for connection success
   - Test API: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/departments`

### Clean Fix (Recommended for Dev/Test)

1. **Delete Database:**
   - Go to PostgreSQL → Danger Zone
   - Click "Delete"
   - ✅ **Check "Delete volumes"** (critical!)
   - Confirm deletion

2. **Recreate Database:**
   - Create new PostgreSQL service
   - Set credentials:
     - Username: `postgres`
     - Password: `1234567890` (or your chosen password)
     - Database: `postgres`
   - **DO NOT change these after creation**

3. **Update DATABASE_URL:**
   - Go to Application → Environment Variables
   - Set `DATABASE_URL`:
     ```
     postgres://postgres:1234567890@lwgk444swsk0sos4gkw4okgk:5432/postgres
     ```
   - Replace `1234567890` with your actual password
   - Replace `lwgk444swsk0sos4gkw4okgk` if service ID changed

4. **Redeploy Backend:**
   - Go to Application → Click "Redeploy"

5. **Verify:**
   - Check backend logs
   - Test API endpoint

## Testing Commands

### From Backend Container Terminal
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
apk add --no-cache postgresql-client
psql "$DATABASE_URL" -c "SELECT version();"
```

### Expected Success Output
```
PostgreSQL 17.x on x86_64...
```

### Expected Failure Output
```
psql: error: connection to server at "lwgk444swsk0sos4gkw4okgk" (172.x.x.x), port 5432 failed: FATAL: password authentication failed for user "postgres"
```

## Next Steps

1. ✅ **Verify Database Password** - Check in database terminal or configuration
2. ✅ **Verify DATABASE_URL** - Check in application environment variables
3. ✅ **Compare Values** - Ensure exact match (character-by-character)
4. ✅ **Fix Mismatch** - Use one of the solutions above
5. ✅ **Redeploy** - Restart backend application
6. ✅ **Test** - Verify API endpoint works

## Important Notes

- **PostgreSQL credentials are set on first container start** and stored in Docker volume
- **Changing credentials in Coolify UI does NOT update the database** - you must delete volumes or reset inside Postgres
- **Service ID is the hostname**, not the display name
- **Passwords must match exactly** - check for typos, extra spaces, encoding issues
- **Special characters must be URL-encoded** in DATABASE_URL

## Support Information

- Database Service: `lwgk444swsk0sos4gkw4okgk`
- Application Service: `q8k0w4kggcw0ks4cooskcwss`
- Network: `coolify` (both services should be on same network)
- Port: `5432` (PostgreSQL default)



# Fix: DATABASE_URL Environment Variable Not Found

## Error Message
```
error: Environment variable not found: DATABASE_URL.
  -->  schema.prisma:10
```

## Root Cause
The `DATABASE_URL` environment variable is either:
1. ❌ Not set in Coolify environment variables
2. ❌ Not marked as "Available at Runtime"
3. ❌ Container not restarted/redeployed after adding the variable

## Solution Steps

### Step 1: Verify DATABASE_URL is Set

1. Go to your application in Coolify:
   ```
   http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/application/q8k0w4kggcw0ks4cooskcwss/environment-variables
   ```

2. Look for `DATABASE_URL` in the list
   - If it's NOT there → Go to Step 2 (Add it)
   - If it IS there → Go to Step 3 (Check Runtime setting)

### Step 2: Add DATABASE_URL (If Missing)

1. Click the **"+ Add"** button
2. Fill in:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgres://postgres:YOUR_PASSWORD@lwgk444swsk0sos4gkw4okgk:5432/postgres`
     - Replace `YOUR_PASSWORD` with your actual database password
     - Replace `lwgk444swsk0sos4gkw4okgk` with your database service ID if different
3. **CRITICAL**: Check the checkbox for **"Available at Runtime"** ✅
4. **OPTIONAL**: Check "Available at Buildtime" if you need it during build (for Prisma generate)
5. Click **"Update"** or **"Save"**

### Step 3: Verify Runtime Setting (If Already Exists)

1. Find `DATABASE_URL` in the environment variables list
2. Click **"Update"** button (or edit icon)
3. **CRITICAL**: Ensure **"Available at Runtime"** checkbox is CHECKED ✅
4. If unchecked, check it now
5. Click **"Update"** to save

### Step 4: Redeploy the Application

**IMPORTANT**: After adding or modifying environment variables, you MUST redeploy:

1. Go to your application main page:
   ```
   http://31.187.72.16:8000/project/gcskwc40ow4g888k0c8gk0kg/environment/s0so4c48gw0w4gskwk8448w0/application/q8k0w4kggcw0ks4cooskcwss
   ```

2. Click **"Redeploy"** button (NOT just "Restart")
   - "Restart" doesn't reload environment variables
   - "Redeploy" ensures new environment variables are loaded

3. Wait for deployment to complete

### Step 5: Verify the Fix

1. Check application logs for successful startup
2. Test the API endpoint:
   ```
   http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/departments
   ```

3. Expected response:
   ```json
   {
     "success": true,
     "data": [...]
   }
   ```

## Common Mistakes

### ❌ Mistake 1: Only "Available at Buildtime"
- **Problem**: Variable only available during Docker build, not at runtime
- **Fix**: Check **"Available at Runtime"** ✅

### ❌ Mistake 2: Only Restart, Not Redeploy
- **Problem**: Restart doesn't reload environment variables
- **Fix**: Use **"Redeploy"** button

### ❌ Mistake 3: Wrong Variable Name
- **Problem**: Typo in variable name (e.g., `DATABSE_URL` instead of `DATABASE_URL`)
- **Fix**: Ensure exact spelling: `DATABASE_URL`

### ❌ Mistake 4: Variable Not Saved
- **Problem**: Added variable but didn't click "Update" or "Save"
- **Fix**: Always click "Update" after adding/modifying variables

## Verification Commands

### From Backend Container Terminal (Optional)

1. Go to Application → Terminal in Coolify
2. Run:
   ```bash
   echo $DATABASE_URL
   ```
3. **Expected**: Should show your database URL
4. **If empty**: Environment variable is not set correctly

## Quick Checklist

- [ ] `DATABASE_URL` exists in environment variables
- [ ] `DATABASE_URL` value is correct (matches database credentials)
- [ ] **"Available at Runtime"** is CHECKED ✅
- [ ] Application has been **Redeployed** (not just restarted)
- [ ] Container logs show no DATABASE_URL errors
- [ ] API endpoint returns data (not "Database error")

## Database URL Format

```
postgres://[USERNAME]:[PASSWORD]@[HOSTNAME]:[PORT]/[DATABASE]
```

**Example:**
```
postgres://postgres:1234567890@lwgk444swsk0sos4gkw4okgk:5432/postgres
```

**Important:**
- Use service ID (`lwgk444swsk0sos4gkw4okgk`) as hostname, NOT display name
- URL-encode special characters in password:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

## Still Not Working?

If after following these steps it still doesn't work:

1. **Check container logs** for specific error messages
2. **Verify database is running** and accessible
3. **Test connection** from container terminal:
   ```bash
   apk add --no-cache postgresql-client
   psql "$DATABASE_URL" -c "SELECT version();"
   ```
4. **Double-check** all credentials match exactly





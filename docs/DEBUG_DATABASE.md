# Database Connection Debugging Guide

## Common Causes of "Authentication failed" Error

Even if credentials are correct, these issues can cause authentication failures:

### 1. **Special Characters in Password**

If your password contains special characters, they MUST be URL-encoded in the `DATABASE_URL`.

**Special characters that need encoding:**
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `/` → `%2F`
- `?` → `%3F`
- `:` → `%3A`
- ` ` (space) → `%20`

**Example:**
- Password: `MyP@ss#123`
- Encoded: `MyP%40ss%23123`
- Full URL: `postgres://postgres:MyP%40ss%23123@hostname:5432/postgres`

### 2. **Wrong Container Hostname**

In Coolify, the database container name might be different from what you expect.

**How to find the correct hostname:**
1. Go to your Database resource in Coolify
2. Check the "Postgres URL (internal)" field
3. The hostname is the part between `@` and `:5432`
4. Example: `postgres://postgres:pass@lwgk444swsk0sos4gkw4okgk:5432/postgres`
   - Hostname: `lwgk444swsk0sos4gkw4okgk`

### 3. **Password Mismatch**

The password in `DATABASE_URL` must EXACTLY match the database password.

**To verify:**
1. Go to Database → Configuration
2. Check the "Password" field
3. Compare character-by-character with your `DATABASE_URL`

### 4. **Username Mismatch**

Default PostgreSQL username is usually `postgres`, but verify:
1. Go to Database → Configuration
2. Check the "Username" field
3. Ensure it matches in `DATABASE_URL`

### 5. **Database Name**

Check if the database name is correct:
- Default: `postgres`
- Or check Database → Configuration → "Initial Database"

---

## Step-by-Step Debugging

### Step 1: Verify Database is Running

In Coolify:
1. Go to your Database resource
2. Check status is "Running" (green)
3. Check logs for any errors

### Step 2: Test Connection from Backend Container

1. Go to Backend → Terminal
2. Run:
   ```bash
   # Install postgresql-client if needed
   apk add --no-cache postgresql-client
   
   # Test connection (replace with your actual values)
   psql "postgres://postgres:YOUR_PASSWORD@DATABASE_HOSTNAME:5432/postgres" -c "SELECT version();"
   ```

### Step 3: Check Environment Variable

1. Go to Backend → Terminal
2. Run:
   ```bash
   echo $DATABASE_URL
   ```
3. Verify:
   - Format is correct
   - Password is URL-encoded if needed
   - Hostname matches database container

### Step 4: Test with Prisma

In Backend Terminal:
```bash
npx prisma db pull
```

This will show the exact connection error.

---

## URL Encoding Helper

Use this online tool or encode manually:
- https://www.urlencoder.org/

**Example encoding:**
```
Original password: 1234567890@#$%
Encoded password: 1234567890%40%23%24%25
```

---

## Correct DATABASE_URL Format

```
postgres://[username]:[password]@[hostname]:[port]/[database]?schema=public
```

**Example (no special chars):**
```
postgres://postgres:1234567890@lwgk444swsk0sos4gkw4okgk:5432/postgres?schema=public
```

**Example (with special chars):**
```
postgres://postgres:MyP%40ss%23123@lwgk444swsk0sos4gkw4okgk:5432/postgres?schema=public
```

---

## Quick Fix Checklist

- [ ] Database container is "Running" in Coolify
- [ ] Username in DATABASE_URL matches database username exactly
- [ ] Password in DATABASE_URL matches database password exactly
- [ ] Special characters in password are URL-encoded
- [ ] Hostname in DATABASE_URL matches database container name
- [ ] Port is `5432` (default PostgreSQL port)
- [ ] Database name is correct (usually `postgres`)
- [ ] Backend has been restarted after updating DATABASE_URL
- [ ] Both "Available at Buildtime" and "Available at Runtime" are checked

---

## Testing Connection

### Method 1: Using psql (in backend container)

```bash
# Connect to database
psql "postgres://postgres:YOUR_PASSWORD@DATABASE_HOSTNAME:5432/postgres"

# If connection works, you'll see:
# postgres=#
```

### Method 2: Using Prisma Studio

```bash
npx prisma studio
```

This will attempt to connect and show any errors.

### Method 3: Test in Node.js

Create a test file:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();
```

---

## Still Not Working?

If all above checks pass, try:

1. **Reset Database Password:**
   - In Coolify Database → Configuration
   - Change password to something simple (no special chars)
   - Update DATABASE_URL with new password
   - Restart backend

2. **Check Network:**
   - Ensure both backend and database are in the same project/network
   - In Coolify, they should be in the same project

3. **Check Logs:**
   - Backend logs: Look for Prisma connection errors
   - Database logs: Look for authentication attempts

4. **Verify Prisma Client:**
   ```bash
   npx prisma generate
   ```






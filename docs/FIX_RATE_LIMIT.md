# Fix "Too Many Authentication Attempts" Error

## Problem
You're seeing: "Too many authentication attempts, please try again later."

## Cause
The backend has rate limiting on authentication routes:
- **Production**: 10 login attempts per 15 minutes
- **Development**: Now increased to 100 attempts per 15 minutes
- **Localhost**: Rate limiting is now skipped in development

## Solution Applied

I've updated the rate limiter to:
1. Allow 100 attempts in development (instead of 10)
2. Skip rate limiting for localhost in development
3. Keep strict limits in production for security

## Quick Fix

**Restart the backend server** to apply the changes:

1. Stop the current backend (Ctrl+C in the terminal running `npm run dev`)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```

## Alternative: Clear Rate Limit (If Still Blocked)

If you're still blocked, you can:

1. **Wait 15 minutes** - The rate limit resets automatically
2. **Restart the backend** - This clears the in-memory rate limit counter
3. **Use a different IP** - If testing from different machines

## After Restart

Once you restart the backend, you should be able to login without the rate limit error.

The admin panel dev server should auto-reload, but if needed, refresh:
```
http://localhost:5173
```

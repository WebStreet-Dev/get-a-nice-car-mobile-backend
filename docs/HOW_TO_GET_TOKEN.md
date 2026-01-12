# How to Get Authentication Token for Step 3

## Step-by-Step: Getting Your Token

### Step 1: Login to Get Token

1. **Open Postman**
2. **Create a new request** (or use existing one)
3. **Set Method:** `POST`
4. **Enter URL:**
   ```
   http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/auth/login
   ```

5. **Go to Headers tab:**
   - Click **Headers** tab
   - Add header:
     - **Key:** `Content-Type`
     - **Value:** `application/json`

6. **Go to Body tab:**
   - Click **Body** tab
   - Select **raw** radio button
   - Select **JSON** from dropdown (on the right)
   - Paste this JSON:
     ```json
     {
       "email": "admin@getanicecar.com",
       "password": "admin123456"
     }
     ```

7. **Click Send button**

8. **Look at the Response:**
   - You should see a response like this:
     ```json
     {
       "success": true,
       "data": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsImVtYWlsIjoiYWRtaW5AZ2V0YW5pY2VjYXIuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzA0MTIzNDU2LCJleHAiOjE3MDQxMjk0NTZ9.abc123xyz...",
         "refreshToken": "...",
         "user": {
           "id": "...",
           "email": "admin@getanicecar.com",
           "role": "ADMIN"
         }
       }
     }
     ```

9. **Copy the `accessToken` value:**
   - Find the `accessToken` field in the response
   - Copy the entire token (it's a long string starting with `eyJ...`)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsImVtYWlsIjoiYWRtaW5AZ2V0YW5pY2VjYXIuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzA0MTIzNDU2LCJleHAiOjE3MDQxMjk0NTZ9.abc123xyz...`

---

### Step 2: Use Token in Admin Endpoints

Now that you have the token, use it in Step 3 requests:

1. **Create a new request** in Postman
2. **Set Method:** `GET`
3. **Enter URL:** (choose one)
   - `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/users`
   - OR `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/appointments`
   - OR any other admin endpoint

4. **Go to Headers tab:**
   - Click **Headers** tab
   - Add these two headers:

   **Header 1:**
   - **Key:** `Authorization`
   - **Value:** `Bearer <paste-your-token-here>`
   
   **Important:** Make sure to include the word `Bearer` followed by a space, then paste your token.
   
   Example:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsImVtYWlsIjoiYWRtaW5AZ2V0YW5pY2VjYXIuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzA0MTIzNDU2LCJleHAiOjE3MDQxMjk0NTZ9.abc123xyz...
   ```

   **Header 2:**
   - **Key:** `Content-Type`
   - **Value:** `application/json`

5. **Click Send**

---

## Visual Guide

### Login Request Setup:
```
Method: POST
URL: http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/auth/login

Headers:
┌─────────────────┬──────────────────────────┐
│ Content-Type    │ application/json          │
└─────────────────┴──────────────────────────┘

Body (Body tab → raw → JSON):
{
  "email": "admin@getanicecar.com",
  "password": "admin123456"
}
```

### Admin Endpoint Request Setup:
```
Method: GET
URL: http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/users

Headers:
┌─────────────────┬──────────────────────────────────────────────┐
│ Authorization   │ Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
│ Content-Type    │ application/json                               │
└─────────────────┴──────────────────────────────────────────────┘
```

---

## Quick Copy-Paste Values

### Login Credentials:
```json
{
  "email": "admin@getanicecar.com",
  "password": "admin123456"
}
```

### Login URL:
```
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/auth/login
```

### Admin Endpoints (use with token):
```
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/users
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/appointments
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/departments
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/faqs
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/downpayment
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/breakdown
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/roles
```

---

## Troubleshooting

**Q: Where do I find the token?**  
A: After logging in (Step 2), look at the response body. Find the `accessToken` field and copy its value.

**Q: The token is very long, do I copy all of it?**  
A: Yes! Copy the entire token string, even though it's long.

**Q: What if I get "Token expired" error?**  
A: Login again to get a new token. Tokens expire after some time.

**Q: Do I need to login every time?**  
A: No, tokens last for a while. Only login again if you get a 401 error.

**Q: What if login returns an error?**  
A: Check:
- Email and password are correct
- Server is running
- URL is correct

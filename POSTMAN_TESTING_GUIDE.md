# Postman Testing Guide for Admin Endpoints

## Base URL
```
http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io
```

## Step 1: Test Route (No Authentication Required)

This route doesn't require authentication - use it to verify the router is working.

**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/test`

**Headers:** None required

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin router is working",
  "path": "/test",
  "url": "/test",
  "originalUrl": "/api/v1/admin/test",
  "baseUrl": ""
}
```

---

## Step 2: Get Authentication Token

Before testing other endpoints, you need to login and get a token.

**Method:** `POST`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@getanicecar.com",
  "password": "admin123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@getanicecar.com",
      "role": "ADMIN"
    }
  }
}
```

**Copy the `accessToken` value** - you'll need it for all other requests.

---

## Step 3: Test Admin Endpoints (Authentication Required)

For all these endpoints, you need to add the Authorization header.

### Setup Authorization Header in Postman:

1. In Postman, go to the **Headers** tab
2. Add a new header:
   - **Key:** `Authorization`
   - **Value:** `Bearer <paste-your-access-token-here>`
   
   Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Also add:
   - **Key:** `Content-Type`
   - **Value:** `application/json`

---

## Endpoints to Test

### 1. Get All Users
**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/users`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

---

### 2. Get All Appointments
**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/appointments`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

---

### 3. Get All Departments
**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/departments`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

---

### 4. Get All FAQs
**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/faqs`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

---

### 5. Get All Downpayment Categories
**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/downpayment`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

---

### 6. Get All Breakdown Requests
**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/breakdown`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

---

### 7. Get All Roles
**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/roles`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

---

### 8. Get Dashboard Stats
**Method:** `GET`  
**URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/dashboard`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

---

## Quick Postman Setup Instructions

### For Test Route (No Auth):
1. Open Postman
2. Select **GET** method
3. Enter URL: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/test`
4. Click **Send**
5. No headers needed

### For Other Routes (With Auth):
1. **First, get token:**
   - Method: **POST**
   - URL: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/auth/login`
   - Headers tab: Add `Content-Type: application/json`
   - Body tab: Select **raw** and **JSON**, paste:
     ```json
     {
       "email": "admin@getanicecar.com",
       "password": "admin123456"
     }
     ```
   - Click **Send**
   - Copy the `accessToken` from response

2. **Then test admin endpoints:**
   - Method: **GET**
   - URL: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io/api/v1/admin/users` (or any endpoint)
   - Headers tab: Add:
     - `Authorization: Bearer <paste-token-here>`
     - `Content-Type: application/json`
   - Click **Send**

---

## Expected Responses

### Success (200 OK):
```json
{
  "success": true,
  "data": [...]
}
```

### Authentication Error (401):
```json
{
  "success": false,
  "error": "No token provided"
}
```
or
```json
{
  "success": false,
  "error": "Token expired"
}
```

### Route Not Found (404):
```json
{
  "success": false,
  "error": "Route GET /api/v1/admin/users not found"
}
```

### Permission Error (403):
```json
{
  "success": false,
  "error": "Admin access required"
}
```

---

## Troubleshooting

1. **If test route returns 404:**
   - Server might not be running
   - Routes might not be compiled
   - Check server logs

2. **If test route works but others return 404:**
   - Check if you're using the correct URL (plural forms: `/users`, not `/user`)
   - Verify server is restarted after code changes

3. **If you get 401:**
   - Token is missing or invalid
   - Make sure to include `Bearer ` before the token
   - Token might be expired - login again

4. **If you get 403:**
   - User doesn't have ADMIN or SUPER_ADMIN role
   - Use admin credentials to login

---

## Default Admin Credentials

```
Email: admin@getanicecar.com
Password: admin123456
```

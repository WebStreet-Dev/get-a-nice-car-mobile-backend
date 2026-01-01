# Postman API Testing Collection

**Base URL:** `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io`

---

## 🔧 Setup Instructions

1. **Create Environment Variable in Postman:**
   - Variable: `baseUrl`
   - Value: `http://q8k0w4kggcw0ks4cooskcwss.31.187.72.16.sslip.io`
   - Use `{{baseUrl}}` in all requests

2. **Authentication:**
   - After login, copy the `accessToken` from response
   - Add to Headers: `Authorization: Bearer {{accessToken}}`
   - Or set as environment variable: `token` and use `Bearer {{token}}`

---

## 📋 API Endpoints

### 🏥 Health Check

#### GET /health
- **Description:** Check if server is running
- **Auth:** None
- **Request:**
  ```
  GET {{baseUrl}}/health
  ```

---

### 🔐 Authentication (Public)

#### POST /api/v1/auth/register
- **Description:** Register a new user
- **Auth:** None
- **Request:**
  ```json
  POST {{baseUrl}}/api/v1/auth/register
  Content-Type: application/json
  
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "password": "SecurePass123!"
  }
  ```

#### POST /api/v1/auth/login
- **Description:** Login user
- **Auth:** None
- **Request:**
  ```json
  POST {{baseUrl}}/api/v1/auth/login
  Content-Type: application/json
  
  {
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response:** Returns `accessToken` and `refreshToken`

#### POST /api/v1/auth/refresh
- **Description:** Refresh access token
- **Auth:** None
- **Request:**
  ```json
  POST {{baseUrl}}/api/v1/auth/refresh
  Content-Type: application/json
  
  {
    "refreshToken": "your_refresh_token_here"
  }
  ```

#### POST /api/v1/auth/logout
- **Description:** Logout user (invalidate refresh token)
- **Auth:** None
- **Request:**
  ```json
  POST {{baseUrl}}/api/v1/auth/logout
  Content-Type: application/json
  
  {
    "refreshToken": "your_refresh_token_here"
  }
  ```

#### GET /api/v1/auth/me
- **Description:** Get current user info
- **Auth:** Required (Bearer Token)
- **Headers:**
  ```
  Authorization: Bearer {{accessToken}}
  ```
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/auth/me
  ```

#### PUT /api/v1/auth/change-password
- **Description:** Change user password
- **Auth:** Required (Bearer Token)
- **Request:**
  ```json
  PUT {{baseUrl}}/api/v1/auth/change-password
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
  
  {
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass123!"
  }
  ```

---

### 👤 User Profile (Private)

#### GET /api/v1/users/me
- **Description:** Get current user profile
- **Auth:** Required
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/users/me
  Authorization: Bearer {{accessToken}}
  ```

#### PUT /api/v1/users/me
- **Description:** Update user profile
- **Auth:** Required
- **Request:**
  ```json
  PUT {{baseUrl}}/api/v1/users/me
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
  
  {
    "name": "John Updated",
    "phone": "+1234567891"
  }
  ```

#### PUT /api/v1/users/me/fcm-token
- **Description:** Update FCM token for push notifications
- **Auth:** Required
- **Request:**
  ```json
  PUT {{baseUrl}}/api/v1/users/me/fcm-token
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
  
  {
    "fcmToken": "your_fcm_token_here"
  }
  ```

#### DELETE /api/v1/users/me/fcm-token
- **Description:** Remove FCM token
- **Auth:** Required
- **Request:**
  ```
  DELETE {{baseUrl}}/api/v1/users/me/fcm-token
  Authorization: Bearer {{accessToken}}
  ```

---

### 📅 Appointments (Private)

#### POST /api/v1/appointments
- **Description:** Create a new appointment
- **Auth:** Required
- **Request:**
  ```json
  POST {{baseUrl}}/api/v1/appointments
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
  
  {
    "departmentId": "department-uuid-here",
    "dateTime": "2025-12-25T10:00:00Z",
    "vehicleOfInterest": "Toyota Camry 2023",
    "notes": "Interested in test drive",
    "contactName": "John Doe",
    "contactEmail": "john@example.com",
    "contactPhone": "+1234567890"
  }
  ```

#### GET /api/v1/appointments
- **Description:** Get user's appointments (with pagination and filters)
- **Auth:** Required
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `status` (optional): Filter by status (PENDING, CONFIRMED, CANCELLED, COMPLETED)
  - `departmentId` (optional): Filter by department ID
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/appointments?page=1&limit=10&status=PENDING
  Authorization: Bearer {{accessToken}}
  ```

#### GET /api/v1/appointments/:id
- **Description:** Get a single appointment by ID
- **Auth:** Required
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/appointments/{appointmentId}
  Authorization: Bearer {{accessToken}}
  ```

#### PUT /api/v1/appointments/:id
- **Description:** Update an appointment
- **Auth:** Required
- **Request:**
  ```json
  PUT {{baseUrl}}/api/v1/appointments/{appointmentId}
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
  
  {
    "dateTime": "2025-12-25T14:00:00Z",
    "notes": "Updated notes",
    "vehicleOfInterest": "Honda Accord 2024"
  }
  ```

#### DELETE /api/v1/appointments/:id
- **Description:** Cancel an appointment
- **Auth:** Required
- **Request:**
  ```
  DELETE {{baseUrl}}/api/v1/appointments/{appointmentId}
  Authorization: Bearer {{accessToken}}
  ```

---

### 🚗 Breakdown Requests (Private)

#### POST /api/v1/breakdown
- **Description:** Create a new breakdown request
- **Auth:** Required
- **Request:**
  ```json
  POST {{baseUrl}}/api/v1/breakdown
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
  
  {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "locationType": "CURRENT",
    "notes": "Car broke down on highway"
  }
  ```
- **Note:** For live tracking, use `locationType: "LIVE"` and include `liveDurationMinutes`

#### GET /api/v1/breakdown/active
- **Description:** Get active breakdown request
- **Auth:** Required
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/breakdown/active
  Authorization: Bearer {{accessToken}}
  ```

#### GET /api/v1/breakdown/:id
- **Description:** Get breakdown request by ID
- **Auth:** Required
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/breakdown/{breakdownId}
  Authorization: Bearer {{accessToken}}
  ```

#### PUT /api/v1/breakdown/:id/location
- **Description:** Update location for a live breakdown request
- **Auth:** Required
- **Request:**
  ```json
  PUT {{baseUrl}}/api/v1/breakdown/{breakdownId}/location
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
  
  {
    "latitude": 40.7130,
    "longitude": -74.0062
  }
  ```

#### DELETE /api/v1/breakdown/:id
- **Description:** Cancel a breakdown request
- **Auth:** Required
- **Request:**
  ```
  DELETE {{baseUrl}}/api/v1/breakdown/{breakdownId}
  Authorization: Bearer {{accessToken}}
  ```

---

### 🏢 Departments (Public)

#### GET /api/v1/departments
- **Description:** Get all active departments
- **Auth:** None
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/departments
  ```

#### GET /api/v1/departments/:id
- **Description:** Get department by ID
- **Auth:** None
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/departments/{departmentId}
  ```

---

### ❓ FAQs (Public)

#### GET /api/v1/faqs
- **Description:** Get all FAQs (optionally filter by category)
- **Auth:** None
- **Query Parameters:**
  - `category` (optional): Filter by category (SALES, SERVICE, GENERAL, ACCOUNTING)
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/faqs?category=SALES
  ```

#### GET /api/v1/faqs/:id
- **Description:** Get FAQ by ID
- **Auth:** None
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/faqs/{faqId}
  ```

---

### 💰 Downpayment Categories (Public)

#### GET /api/v1/downpayment
- **Description:** Get all active downpayment categories
- **Auth:** None
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/downpayment
  ```

#### GET /api/v1/downpayment/:id
- **Description:** Get downpayment category by ID
- **Auth:** None
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/downpayment/{categoryId}
  ```

---

### 🔔 Notifications (Private)

#### GET /api/v1/notifications
- **Description:** Get user's notifications
- **Auth:** Required
- **Request:**
  ```
  GET {{baseUrl}}/api/v1/notifications
  Authorization: Bearer {{accessToken}}
  ```

#### PUT /api/v1/notifications/read-all
- **Description:** Mark all notifications as read
- **Auth:** Required
- **Request:**
  ```
  PUT {{baseUrl}}/api/v1/notifications/read-all
  Authorization: Bearer {{accessToken}}
  ```

#### PUT /api/v1/notifications/:id/read
- **Description:** Mark notification as read
- **Auth:** Required
- **Request:**
  ```
  PUT {{baseUrl}}/api/v1/notifications/{notificationId}/read
  Authorization: Bearer {{accessToken}}
  ```

#### DELETE /api/v1/notifications/:id
- **Description:** Delete a notification
- **Auth:** Required
- **Request:**
  ```
  DELETE {{baseUrl}}/api/v1/notifications/{notificationId}
  Authorization: Bearer {{accessToken}}
  ```

---

## 🧪 Testing Workflow

### Step 1: Health Check
```
GET {{baseUrl}}/health
```
Expected: `200 OK` with status "ok"

### Step 2: Register a User
```
POST {{baseUrl}}/api/v1/auth/register
```
Expected: `201 Created` with user data

### Step 3: Login
```
POST {{baseUrl}}/api/v1/auth/login
```
Expected: `200 OK` with `accessToken` and `refreshToken`
**Save the `accessToken` for subsequent requests**

### Step 4: Get Public Data
```
GET {{baseUrl}}/api/v1/departments
GET {{baseUrl}}/api/v1/faqs
GET {{baseUrl}}/api/v1/downpayment
```

### Step 5: Test Protected Endpoints
Use the `accessToken` from Step 3:
```
GET {{baseUrl}}/api/v1/auth/me
Authorization: Bearer {{accessToken}}
```

### Step 6: Create Appointment
```
POST {{baseUrl}}/api/v1/appointments
Authorization: Bearer {{accessToken}}
```
(You'll need a valid `departmentId` from the departments endpoint)

---

## 📝 Notes

1. **Date Format:** Use ISO 8601 format: `2025-12-25T10:00:00Z`
2. **UUIDs:** Replace `{id}`, `{appointmentId}`, etc. with actual UUIDs from responses
3. **Pagination:** Default page size is 10, use `?page=1&limit=20` to customize
4. **Error Responses:** All errors follow format:
   ```json
   {
     "success": false,
     "error": "Error message",
     "errors": { /* validation errors if any */ }
   }
   ```
5. **Success Responses:** Follow format:
   ```json
   {
     "success": true,
     "data": { /* response data */ }
   }
   ```

---

## 🔑 Test Credentials (After Seeding)

If you've run the seed script, you can use:
- **Super Admin:**
  - Email: `superadmin@getanicecar.com`
  - Password: `superadmin123456`

- **Admin:**
  - Email: `admin@getanicecar.com` (or your ADMIN_EMAIL env var)
  - Password: `admin123456` (or your ADMIN_PASSWORD env var)

- **Test User:**
  - Email: `john.doe@example.com`
  - Password: `test123456`





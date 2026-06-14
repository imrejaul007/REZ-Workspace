# CorpPerks Backend API Documentation

**Version:** 1.0.0
**Base URL:** `https://corpperks-api.onrender.com`
**Port:** 4006

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

### Auth Endpoints

#### POST `/api/auth/register`
Register a new user and tenant.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "...",
      "email": "admin@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "tenantId": "..."
    },
    "tenant": {
      "_id": "...",
      "name": "Acme Corp",
      "status": "trial"
    }
  }
}
```

---

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

---

#### GET `/api/auth/me`
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "employee": { ... }
  }
}
```

---

#### POST `/api/auth/change-password`
Change current user's password.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

---

## Employees

#### GET `/api/employees`
List employees with pagination and filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| search | string | Search by name/email |
| department | string | Filter by department |
| status | string | Filter by status |

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

#### GET `/api/employees/:id`
Get single employee by ID.

---

#### POST `/api/employees`
Create new employee.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@company.com",
  "phone": "+1234567890",
  "department": "Engineering",
  "designation": "Software Engineer",
  "joiningDate": "2026-01-15",
  "employmentType": "full_time",
  "managerId": "emp_id_123"
}
```

---

#### PUT `/api/employees/:id`
Update employee details.

---

#### DELETE `/api/employees/:id`
Soft delete employee (sets `isDeleted: true`).

---

## Leave Management

#### GET `/api/leave`
List leave requests with filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| status | string | Filter: pending, approved, rejected, cancelled |
| leaveType | string | Filter: sick, casual, earned, wfh, annual, unpaid |

---

#### POST `/api/leave`
Create new leave request.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "employeeId": "EMP-123",
  "leaveType": "sick",
  "startDate": "2026-05-25",
  "endDate": "2026-05-27",
  "reason": "Medical appointment"
}
```

---

#### PUT `/api/leave/:id`
Update leave request status (approve/reject).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "approved",
  "rejectionReason": "Optional reason if rejecting"
}
```

---

#### PUT `/api/leave/:id/cancel`
Cancel a pending leave request.

---

#### GET `/api/leave/balances/all`
Get all employees' leave balances.

---

## Attendance

#### GET `/api/attendance`
List attendance records.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| date | string | Filter by date (YYYY-MM-DD) |
| employeeId | string | Filter by employee |

---

#### GET `/api/attendance/today`
Get today's attendance summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "present": 45,
    "absent": 3,
    "late": 2,
    "onLeave": 5
  }
}
```

---

#### GET `/api/attendance/stats`
Get attendance statistics.

---

#### POST `/api/attendance/check-in`
Employee check-in.

**Request:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "123 MG Road, Bangalore"
}
```

---

#### POST `/api/attendance/check-out`
Employee check-out.

**Request:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "123 MG Road, Bangalore"
}
```

---

## Shifts

#### GET `/api/shifts`
List shift schedules.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| date | string | Filter by date |
| status | string | Filter: scheduled, confirmed, in_progress, completed |

---

#### GET `/api/shifts/stats`
Get shift statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "active": 10,
    "total": 50,
    "completed": 35,
    "late": 5
  }
}
```

---

#### GET `/api/shifts/templates`
Get shift templates.

---

#### POST `/api/shifts`
Create new shift.

**Request:**
```json
{
  "employeeId": "EMP-123",
  "date": "2026-05-25",
  "startTime": "09:00",
  "endTime": "18:00",
  "breakMinutes": 60
}
```

---

#### PUT `/api/shifts/:id/start`
Start a scheduled shift.

---

#### PUT `/api/shifts/:id/complete`
Complete an active shift.

---

## Departments

#### GET `/api/departments`
List all departments.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Engineering",
      "code": "ENG",
      "description": "Software development team",
      "employeeCount": 25,
      "isActive": true
    }
  ]
}
```

---

#### POST `/api/departments`
Create new department.

**Request:**
```json
{
  "name": "Marketing",
  "code": "MKT",
  "description": "Marketing and sales team",
  "headId": "EMP-456"
}
```

---

## Users (Admin)

#### GET `/api/users`
List users (admin only).

---

#### PUT `/api/users/:id/role`
Update user role (admin only).

**Request:**
```json
{
  "role": "hr_manager"
}
```

**Roles:** `super_admin`, `admin`, `hr_manager`, `manager`, `employee`

---

## Health Check

#### GET `/health`
Health check endpoint (no auth required).

**Response:**
```json
{
  "status": "ok",
  "service": "corpperks-backend",
  "version": "1.0.0",
  "timestamp": "2026-05-22T00:00:00.000Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

**Common Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

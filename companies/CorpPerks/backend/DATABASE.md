# CorpPerks Backend - Database Schema

**Database:** MongoDB
**ODM:** Mongoose

---

## Collections Overview

| Collection | Purpose | Key Indexes |
|------------|---------|-------------|
| `tenants` | Multi-tenant organizations | slug (unique) |
| `users` | User accounts & auth | email+tenantId (unique) |
| `employees` | Employee records | tenantId+employeeId (unique) |
| `leaverequests` | Leave applications | tenantId+status |
| `attendances` | Daily attendance | tenantId+employeeId+date (unique) |
| `shifts` | Shift schedules | tenantId+date |
| `shift_templates` | Shift presets | tenantId |
| `departments` | Org structure | tenantId+code (unique) |

---

## Tenant

Multi-tenant organization container.

```javascript
{
  _id: ObjectId,
  name: String,           // "Acme Corporation"
  slug: String,           // "acme-corporation" (unique)
  domain: String,         // "acme.com"
  logo: String,           // URL to logo
  settings: {
    timezone: String,     // "Asia/Kolkata"
    currency: String,     // "INR"
    dateFormat: String,   // "DD/MM/YYYY"
    weekStartsOn: Number, // 1 (Monday)
    allowSelfRegistration: Boolean
  },
  status: String,         // "active" | "suspended" | "trial"
  trialEndsAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `slug` (unique)

---

## User

User authentication and authorization.

```javascript
{
  _id: ObjectId,
  email: String,         // "john@acme.com" (lowercase)
  password: String,      // bcrypt hashed
  firstName: String,
  lastName: String,
  phone: String,
  avatar: String,        // URL to avatar
  role: String,          // "super_admin" | "admin" | "hr_manager" | "manager" | "employee"
  tenantId: ObjectId,    // Reference to Tenant
  employeeId: String,    // Reference to Employee (optional)
  isActive: Boolean,
  lastLoginAt: Date,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email + tenantId` (unique)
- `tenantId + role`

**Methods:**
- `comparePassword(candidatePassword)` - Verify password

---

## Employee

Employee profile and details.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,    // Reference to Tenant
  userId: ObjectId,     // Reference to User (optional)
  employeeId: String,    // "EMP-1234567890"
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  avatar: String,
  dateOfBirth: Date,
  joiningDate: Date,
  department: String,
  designation: String,
  managerId: String,     // Reference to Employee
  employmentType: String, // "full_time" | "part_time" | "contract" | "intern"
  status: String,        // "active" | "inactive" | "on_leave" | "terminated"
  leaveBalance: {
    sick: Number,        // Default: 12
    casual: Number,      // Default: 10
    earned: Number,      // Default: 0
    wfh: Number,         // Default: 6
    annual: Number       // Default: 20
  },
  attendanceEnabled: Boolean,
  geoFenceEnabled: Boolean,
  geoFenceRadius: Number, // meters
  isDeleted: Boolean,
  terminatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + employeeId` (unique)
- `tenantId + department`
- `tenantId + managerId`
- `email`

**Virtuals:**
- `fullName` - Concatenated firstName + lastName

---

## LeaveRequest

Leave/absence applications.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  employeeId: String,
  employeeName: String,
  leaveType: String,     // "sick" | "casual" | "earned" | "wfh" | "annual" | "unpaid"
  startDate: Date,
  endDate: Date,
  totalDays: Number,
  reason: String,
  status: String,        // "pending" | "approved" | "rejected" | "cancelled"
  approvedBy: String,
  approvedAt: Date,
  rejectionReason: String,
  attachments: [String],  // URLs to files
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + employeeId`
- `tenantId + status`
- `startDate + endDate`

---

## Attendance

Daily attendance records.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  employeeId: String,
  date: Date,
  checkIn: Date,
  checkOut: Date,
  checkInLocation: {
    type: String,         // "Point"
    coordinates: [Number], // [longitude, latitude]
    address: String
  },
  checkOutLocation: {
    type: String,
    coordinates: [Number],
    address: String
  },
  status: String,        // "present" | "absent" | "late" | "half_day" | "on_leave"
  remarks: String,
  isRemote: Boolean,
  hoursWorked: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + employeeId + date` (unique)
- `tenantId + date`

---

## Shift

Employee shift schedules.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  employeeId: String,
  employeeName: String,
  date: Date,
  startTime: String,     // "09:00"
  endTime: String,       // "18:00"
  breakMinutes: Number,   // 60
  status: String,        // "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "absent"
  checkIn: Date,
  checkOut: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + date`
- `employeeId + date`

---

## ShiftTemplate

Reusable shift presets.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,          // "Morning Shift"
  startTime: String,     // "09:00"
  endTime: String,       // "18:00"
  breakMinutes: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Department

Organizational departments.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,          // "Engineering"
  code: String,          // "ENG"
  headId: String,        // Employee ID
  parentId: ObjectId,    // Parent department
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + code` (unique)

---

## Relationships

```
Tenant (1)
  ├── User (*)
  ├── Employee (*)
  │     ├── Manager (Employee)
  │     └── Department (*)
  ├── LeaveRequest (*)
  ├── Attendance (*)
  ├── Shift (*)
  ├── ShiftTemplate (*)
  └── Department (*)
        └── Parent Department (Department)
```

---

## Data Flow

### New Employee Registration
1. User registers via `/api/auth/register`
2. Tenant created with trial status
3. User created with `admin` role
4. Employee record auto-created with same name

### Leave Application Flow
1. Employee submits leave via `/api/leave`
2. Leave balance validated
3. LeaveRequest created with `pending` status
4. Manager/HR approves via `/api/leave/:id`
5. Employee leave balance deducted

### Attendance Flow
1. Employee checks in via `/api/attendance/check-in`
2. Attendance record created with `present` status
3. Employee checks out via `/api/attendance/check-out`
4. `checkOut` and `hoursWorked` updated

---

## Multi-Tenancy

All queries are scoped by `tenantId` from the JWT token:

```javascript
// From JWT payload
{
  userId: "...",
  email: "john@acme.com",
  role: "admin",
  tenantId: "tenant_abc123"
}

// All queries filter by tenantId
const employees = await Employee.find({ tenantId: req.tenantId });
```

---

## Default Leave Balances

| Type | Days Per Year |
|------|---------------|
| Sick | 12 |
| Casual | 10 |
| Earned | 0 |
| WFH | 6 |
| Annual | 20 |

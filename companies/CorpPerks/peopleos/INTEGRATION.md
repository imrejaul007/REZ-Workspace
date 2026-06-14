# PeopleOS - Backend Integration

## Overview

PeopleOS connects to the CorpPerks Backend API for all workforce management features.

## API Configuration

**File:** `src/lib/api/client.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4006/api/v1';
```

**Environment Variables:**
```bash
# Local development (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4006/api/v1

# Production
NEXT_PUBLIC_API_URL=https://corpperks-api.onrender.com/api/v1
```

---

## Authentication Flow

1. User enters email/password on login page
2. `api.login(email, password)` sends credentials to backend
3. Backend returns JWT token
4. Token stored in localStorage via `api.setToken()`
5. All subsequent requests include `Authorization: Bearer <token>`

```typescript
// Login
const response = await api.login('user@company.com', 'password123');
if (response.success) {
  // Token automatically stored
  router.push('/dashboard');
}

// Logout
await api.logout();
router.push('/login');
```

---

## Data Flow

```
PeopleOS Frontend
        │
        ├── User Action (click button)
        │
        ▼
API Client (lib/api/client.ts)
        │
        ├── Add Authorization header
        ├── Add Tenant-ID header
        │
        ▼
CorpPerks Backend API
        │
        ├── Validate JWT
        ├── Check tenant isolation
        │
        ▼
MongoDB
```

---

## Features Integration

### Leave Management

| Frontend | API Method | Backend Endpoint |
|----------|------------|-----------------|
| View requests | `api.getLeaveRequests()` | GET `/api/leave` |
| Create request | `api.createLeaveRequest()` | POST `/api/leave` |
| Approve/Reject | `api.approveLeaveRequest()` | PUT `/api/leave/:id` |
| Cancel request | `api.cancelLeaveRequest()` | PUT `/api/leave/:id/cancel` |
| View balances | `api.getLeaveBalances()` | GET `/api/leave/balances/all` |

### Attendance

| Frontend | API Method | Backend Endpoint |
|----------|------------|-----------------|
| View records | `api.getAttendanceRecords()` | GET `/api/attendance` |
| Today's stats | `api.getTodayAttendance()` | GET `/api/attendance/today` |
| Check-in | `api.checkIn()` | POST `/api/attendance/check-in` |
| Check-out | `api.checkOut()` | POST `/api/attendance/check-out` |

### Shifts

| Frontend | API Method | Backend Endpoint |
|----------|------------|-----------------|
| View shifts | `api.getShifts()` | GET `/api/shifts` |
| Shift stats | `api.getShiftStats()` | GET `/api/shifts/stats` |
| Create shift | `api.createShift()` | POST `/api/shifts` |
| Start shift | `api.startShift()` | PUT `/api/shifts/:id/start` |
| Complete shift | `api.completeShift()` | PUT `/api/shifts/:id/complete` |

### Employees

| Frontend | API Method | Backend Endpoint |
|----------|------------|-----------------|
| List employees | `api.getEmployees()` | GET `/api/employees` |
| View employee | `api.getEmployee()` | GET `/api/employees/:id` |
| Create employee | `api.createEmployee()` | POST `/api/employees` |
| Update employee | `api.updateEmployee()` | PUT `/api/employees/:id` |
| Delete employee | `api.deleteEmployee()` | DELETE `/api/employees/:id` |

---

## Error Handling

```typescript
try {
  const response = await api.getEmployees({ page: 1, limit: 20 });
  if (response.success) {
    setEmployees(response.data);
  }
} catch (error: any) {
  if (error.message.includes('401')) {
    // Redirect to login
    router.push('/login');
  } else if (error.message.includes('403')) {
    // Show permission error
    toast.error('You do not have permission');
  } else {
    // Show generic error
    toast.error('Something went wrong');
  }
}
```

---

## Mock Data Fallback

The leave page uses mock data when the API is unavailable:

```typescript
const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
```

This allows development without a running backend.

---

## Tenant Isolation

All API calls are automatically scoped to the user's tenant:

```typescript
// From JWT token
{
  userId: "...",
  tenantId: "tenant_abc123",
  role: "admin"
}
```

The backend middleware extracts `tenantId` from the JWT and filters all queries.

---

## Production Checklist

- [x] API client configured
- [x] Auth flow implemented
- [x] Leave page integrated
- [x] Error handling in place
- [ ] Deploy backend to Render
- [ ] Set NEXT_PUBLIC_API_URL to production URL
- [ ] Test full flow in production

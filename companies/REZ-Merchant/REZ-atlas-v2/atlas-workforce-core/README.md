# Atlas Workforce Core

**Port:** 5200 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

AI-native employee management platform for field sales teams. Manage employees, teams, skills, and performance in one unified system.

## Features

- **Employee Management** - Full CRUD for employees with profiles, skills, and roles
- **Team Management** - Organize employees into teams with territory assignments
- **Performance Tracking** - Real-time performance metrics and trends
- **Skill Management** - Track and match skills to tasks

## API Endpoints

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees (filter by team, role, status) |
| GET | `/api/employees/:id` | Get employee by ID |
| POST | `/api/employees` | Create new employee |
| PUT | `/api/employees/:id` | Update employee |
| GET | `/api/employees/:id/performance` | Get performance metrics |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List all teams |
| GET | `/api/teams/:id` | Get team by ID |
| POST | `/api/teams` | Create new team |

## Quick Start

```bash
cd atlas-workforce-core
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5200/health
```

## Example Request

```bash
# Create employee
curl -X POST http://localhost:5200/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Sharma",
    "email": "rahul@company.com",
    "role": "sales_rep",
    "teamId": "team-1",
    "skills": ["restaurant", "retail"],
    "status": "active"
  }'
```

## Data Model

### Employee

```typescript
interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'sales_rep' | 'team_lead' | 'manager' | 'trainer';
  teamId?: string;
  skills: string[];
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: string;
  territory?: string;
  metrics?: {
    visits: number;
    conversions: number;
    revenue: number;
  };
}
```

### Team

```typescript
interface Team {
  id: string;
  name: string;
  leadId?: string;
  territory: string;
  members: string[];
  createdAt: string;
}
```

## Ecosystem Integration

- **RABTUL Auth** - Employee authentication
- **HOJAI AI** - Skill matching, performance predictions
- **REZ Atlas** - Territory assignment, route optimization

## Related Services

- [atlas-workforce-agent](../atlas-workforce-agent) - AI sales agents
- [atlas-workforce-scheduler](../atlas-workforce-scheduler) - Scheduling
- [atlas-workforce-analytics](../atlas-workforce-analytics) - Analytics

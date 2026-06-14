# CorpPerks GraphQL API

GraphQL API for CorpPerks - provides unified access to all CorpPerks data including employees, projects, tasks, attendance, and leave management.

## Quick Start

```bash
cd graphql-api

# Install dependencies
npm install

# Seed demo data
npm run seed

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## Environment Variables

```bash
# Server
GRAPHQL_PORT=4747
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/corpperks

# JWT Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## GraphQL Endpoint

```
http://localhost:4747/graphql
```

## WebSocket Subscriptions

```
ws://localhost:4747/graphql
```

## Demo Credentials

```
Email: john.smith@corpperks.com
Password: password123
```

## GraphQL Schema

### Queries

```graphql
# Get current user
query {
  me {
    id
    name
    email
    department {
      name
    }
  }
}

# Get employees with filtering
query {
  employees(filter: { departmentId: "xxx", status: "active" }) {
    items {
      id
      name
      email
      position
    }
    total
  }
}

# Get projects
query {
  projects(status: active) {
    id
    name
    teamMembers {
      name
    }
  }
}

# Get tasks
query {
  tasks(filter: { projectId: "xxx", status: todo }) {
    items {
      id
      title
      assignee {
        name
      }
    }
  }
}
```

### Mutations

```graphql
# Login
mutation {
  login(email: "john@corpperks.com", password: "password123") {
    token
    employee {
      id
      name
    }
  }
}

# Check In
mutation {
  checkIn(type: check_in) {
    id
    timestamp
    type
  }
}

# Apply Leave
mutation {
  applyLeave(input: {
    type: casual
    startDate: "2024-01-15"
    endDate: "2024-01-17"
    reason: "Personal work"
  }) {
    id
    status
  }
}

# Update Task Status
mutation {
  updateTaskStatus(taskId: "xxx", status: done) {
    id
    title
    status
  }
}
```

### Subscriptions

```graphql
# Subscribe to notifications
subscription {
  notificationAdded(userId: "xxx") {
    id
    title
    message
  }
}

# Subscribe to task updates
subscription {
  taskUpdated(projectId: "xxx") {
    id
    title
    status
  }
}

# Subscribe to new announcements
subscription {
  announcementPosted {
    id
    title
    content
  }
}
```

## Authentication

Include JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

For WebSocket subscriptions, include token in connection params:

```javascript
const ws = new WebSocket('ws://localhost:4747/graphql', {
  connectionParams: {
    authorization: 'Bearer <token>'
  }
});
```

## Rate Limiting

- 100 requests per minute per IP for REST endpoints
- No rate limiting on GraphQL queries by default
- Configure at application level for production

## Health Check

```bash
curl http://localhost:4747/health
```

## Data Models

### Employee
- `id`, `employeeId`, `name`, `email`, `phone`
- `department`, `role`, `position`
- `joiningDate`, `status`, `avatar`

### Department
- `id`, `name`, `code`, `description`
- `manager`, `employees`

### Attendance
- `id`, `employee`, `type`, `timestamp`
- `location`, `deviceInfo`

### Leave
- `id`, `employee`, `type`, `startDate`, `endDate`
- `reason`, `status`, `approvedBy`, `approvedAt`

### Project
- `id`, `name`, `description`
- `department`, `manager`, `status`
- `startDate`, `endDate`, `budget`
- `teamMembers`, `tasks`

### Task
- `id`, `title`, `description`
- `project`, `assignee`
- `status`, `priority`, `dueDate`
- `estimatedHours`, `actualHours`

### Announcement
- `id`, `title`, `content`, `author`
- `priority`, `category`, `isActive`, `expiresAt`

### Notification
- `id`, `user`, `title`, `message`
- `type`, `category`, `isRead`, `actionUrl`

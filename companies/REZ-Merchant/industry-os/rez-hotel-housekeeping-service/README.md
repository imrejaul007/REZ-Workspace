# REZ Hotel Housekeeping Service

**Port: 4020**

Housekeeping management for REZ Hotel Ecosystem - room cleaning, task assignment, and quality tracking.

## Overview

REZ Hotel Housekeeping Service provides:
- Room cleaning schedules
- Task assignment and tracking
- Staff management
- Quality inspections
- Supply inventory

## Features

### Room Management
- Room status tracking (clean, dirty, in-progress, out-of-order)
- Priority cleaning
- Turndown service
- Deep cleaning schedules

### Task Assignment
- Assign to staff
- Time estimates
- Special requests
- Multi-task jobs

### Quality Control
- Inspection checklists
- Issue logging
- Rating system
- Follow-up tracking

### Staff Management
- Schedule management
- Productivity tracking
- Performance metrics
- Workload balancing

## Quick Start

```bash
cd industry-os/rez-hotel-housekeeping-service
npm install
npm run dev
```

Service runs on **port 4020**.

## API Endpoints

### Rooms
```
GET  /api/rooms/:hotelId              - List rooms with status
GET  /api/rooms/:hotelId/:roomId     - Get room status
PUT  /api/rooms/:roomId/status        - Update room status
POST /api/rooms/:roomId/inspection    - Submit inspection
```

### Tasks
```
GET  /api/tasks/:hotelId              - List tasks (filters)
GET  /api/tasks/:taskId              - Get task
POST /api/tasks                       - Create task
PUT  /api/tasks/:taskId              - Update task
POST /api/tasks/:taskId/assign        - Assign staff
POST /api/tasks/:taskId/start         - Start task
POST /api/tasks/:taskId/complete      - Complete task
POST /api/tasks/:taskId/verify       - Verify completion
```

### Staff
```
GET  /api/staff/:hotelId              - List staff
GET  /api/staff/:staffId             - Get staff details
POST /api/staff/:hotelId              - Add staff
PUT  /api/staff/:staffId             - Update staff
GET  /api/staff/:staffId/schedule    - Get schedule
POST /api/staff/:staffId/schedule    - Set schedule
```

### Schedules
```
GET  /api/schedule/:hotelId           - Get daily schedule
POST /api/schedule/generate           - Generate schedule
PUT  /api/schedule/:scheduleId        - Update schedule
```

### Analytics
```
GET  /api/analytics/:hotelId          - Housekeeping stats
GET  /api/analytics/:hotelId/room     - Room analytics
GET  /api/analytics/:hotelId/staff    - Staff productivity
```

## Usage Examples

### Update Room Status
```bash
curl -X PUT http://localhost:4020/api/rooms/room-305/status \
  -H "Content-Type: application/json" \
  -d '{"status": "dirty", "reason": "guest_checkout", "priority": "high"}'
```

### Create Cleaning Task
```bash
curl -X POST http://localhost:4020/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "roomId": "room-305",
    "type": "checkout_clean",
    "priority": "high",
    "requestedBy": "front_desk",
    "notes": "VIP guest, extra attention needed"
  }'
```

### Assign Task
```bash
curl -X POST http://localhost:4020/api/tasks/task-789/assign \
  -H "Content-Type: application/json" \
  -d '{"staffId": "staff-456", "scheduledTime": "2026-06-15T10:00:00Z"}'
```

### Complete Task
```bash
curl -X POST http://localhost:4020/api/tasks/task-789/complete \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "staff-456",
    "completedAt": "2026-06-15T10:45:00Z",
    "notes": "Room cleaned, towels restocked"
  }'
```

### Submit Inspection
```bash
curl -X POST http://localhost:4020/api/rooms/room-305/inspection \
  -H "Content-Type: application/json" \
  -d '{
    "inspectorId": "supervisor-123",
    "rating": 4,
    "checks": [
      {"item": "bedding", "passed": true},
      {"item": "bathroom", "passed": true},
      {"item": "floors", "passed": false, "notes": "Minor stain"}
    ],
    "notes": "Overall good, minor touch-up needed in bathroom"
  }'
```

## Room Status

| Status | Description |
|--------|-------------|
| `clean` | Ready for guest |
| `dirty` | Needs cleaning |
| `in_progress` | Being cleaned |
| `out_of_order` | Not available |
| `occupied` | Guest in room |

## Task Types

| Type | Description |
|------|-------------|
| `checkout_clean` | Post-departure cleaning |
| `stayover` | Daily room cleaning |
| `turndown` | Evening service |
| `deep_clean` | Periodic deep cleaning |
| `emergency` | Urgent cleaning |
| `preparation` | Pre-arrival setup |

## Architecture

```
rez-hotel-housekeeping-service/
├── src/
│   ├── index.ts                  # Express server
│   ├── housekeeping.test.ts      # Tests
│   └── services/
│       └── housekeeping.service.ts  # Business logic
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Integration

Integrates with:
- REZ PMS Service (room status)
- REZ Maintenance Service (issues)
- REZ Staff Scheduling
- REZ Notifications
- REZ Guest Mobile App

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4020 | Service port |

## License

Proprietary - RTNM Group

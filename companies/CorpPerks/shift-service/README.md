# CorpPerks Shift Scheduling Service

A comprehensive shift scheduling service for the CorpPerks workforce management system.

## Features

- **Shift Templates**: Create reusable shift definitions with start/end times
- **Shift Scheduling**: Schedule shifts for specific dates with employee assignments
- **Shift Swapping**: Employees can request to swap shifts with approval workflow
- **Shift Requests**: Time-off requests, coverage requests, and modifications
- **Coverage Tracking**: Track required vs assigned employees per shift

## Quick Start

```bash
# Install dependencies
cd shift-service
npm install

# Start MongoDB (if using local)
mongod

# Seed demo data
npm run seed

# Start development server
npm run dev
```

## API Endpoints

### Shift Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shifts/templates` | Create shift template |
| GET | `/api/shifts/templates` | List all templates |
| GET | `/api/shifts/templates/:id` | Get template by ID |
| PATCH | `/api/shifts/templates/:id` | Update template |
| DELETE | `/api/shifts/templates/:id` | Delete template |

### Shift Schedule
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shifts/schedule` | Create single shift |
| POST | `/api/shifts/schedule/bulk` | Bulk create shifts |
| GET | `/api/shifts/:date` | Get shifts for date |
| GET | `/api/shifts/id/:id` | Get shift by ID |
| PATCH | `/api/shifts/id/:id` | Update shift |
| DELETE | `/api/shifts/id/:id` | Delete shift |
| GET | `/api/shifts/employee/:empId` | Get employee shifts |
| POST | `/api/shifts/:id/assign` | Assign employee |
| POST | `/api/shifts/:id/remove` | Remove employee |

### Shift Swaps
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shifts/swap` | Create swap request |
| GET | `/api/shifts/swap` | List swap requests |
| POST | `/api/shifts/swap/approve` | Approve/reject swap |
| POST | `/api/shifts/swap/:id/cancel` | Cancel swap |
| GET | `/api/shifts/swap/pending/:targetId` | Get pending for employee |

### Shift Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shifts/requests` | Create request |
| GET | `/api/shifts/requests/:empId` | Get employee requests |
| GET | `/api/shifts/requests/pending` | Get pending requests |
| POST | `/api/shifts/requests/review` | Review request |
| POST | `/api/shifts/requests/:id/cancel` | Cancel request |

### Coverage
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shifts/coverage/:date` | Get coverage summary |
| POST | `/api/shifts/coverage` | Create coverage |
| GET | `/api/shifts/coverage/summary/:date` | Get detailed summary |

## Example Requests

### Create Template
```bash
curl -X POST http://localhost:4739/api/shifts/templates \
  -H "Content-Type: application/json" \
  -d '{"name": "Morning Shift", "startTime": "06:00", "endTime": "14:00"}'
```

### Create Shift
```bash
curl -X POST http://localhost:4739/api/shifts/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-05-30",
    "templateId": "<template-id>",
    "employees": ["emp_001", "emp_002"],
    "status": "draft"
  }'
```

### Request Swap
```bash
curl -X POST http://localhost:4739/api/shifts/swap \
  -H "Content-Type: application/json" \
  -d '{
    "requesterId": "emp_001",
    "targetId": "emp_002",
    "shiftId": "<shift-id>",
    "reason": "Personal appointment"
  }'
```

### Approve Swap
```bash
curl -X POST http://localhost:4739/api/shifts/swap/approve \
  -H "Content-Type: application/json" \
  -d '{
    "swapId": "<swap-id>",
    "action": "approve",
    "approvedBy": "manager_001"
  }'
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4739 | Server port |
| MONGODB_URI | mongodb://localhost:27017/corpperks-shifts | MongoDB connection |
| INTERNAL_SERVICE_TOKEN | - | Service-to-service auth token |

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Language**: TypeScript

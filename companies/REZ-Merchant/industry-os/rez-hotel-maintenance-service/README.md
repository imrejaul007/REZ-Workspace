# REZ Hotel Maintenance Service

**Port: 4019**

Maintenance request management for REZ Hotel Ecosystem - tracks work orders, manages vendors, and controls costs.

## Overview

REZ Hotel Maintenance Service provides:
- Maintenance request creation and tracking
- Priority-based workflow (emergency to low)
- Vendor management
- Cost tracking and analytics
- Work history logging

## Features

### Request Management
- Create maintenance requests
- Track status (pending → completed)
- Assign technicians
- Add notes and updates
- Track completion costs

### Priority Levels
| Priority | Response Time | Description |
|----------|---------------|-------------|
| `emergency` | Immediate | Safety/fire/flood |
| `high` | 2 hours | Broken AC/power |
| `medium` | 24 hours | Minor repairs |
| `low` | 1 week | Cosmetic fixes |

### Categories
- Plumbing, Electrical, HVAC
- Furniture, Appliances
- Structural, Painting
- IT/Tech, Cleaning

### Vendor Management
- Add/manage vendors
- Category specialization
- Rating and performance tracking
- Contact management

## Quick Start

```bash
cd industry-os/rez-hotel-maintenance-service
npm install
npm run dev
```

Service runs on **port 4019**.

## API Endpoints

### Requests
```
GET  /api/requests/:hotelId                 - List requests (filters)
GET  /api/requests/:hotelId/:requestId    - Get request
POST /api/requests                         - Create request
PUT  /api/requests/:id                     - Update request
POST /api/requests/:id/assign             - Assign technician
POST /api/requests/:id/start              - Start work
POST /api/requests/:id/complete            - Complete request
POST /api/requests/:id/cancel              - Cancel request
POST /api/requests/:id/notes              - Add note
POST /api/requests/:id/vendor             - Assign vendor
```

### Vendors
```
GET  /api/vendors/:hotelId                - List vendors
GET  /api/vendors/:hotelId/:vendorId     - Get vendor
POST /api/vendors                          - Add vendor
PUT  /api/vendors/:id                      - Update vendor
DELETE /api/vendors/:id                   - Deactivate vendor
```

### Analytics
```
GET /api/stats/:hotelId                   - Get maintenance stats
```

## Usage Examples

### Create Request
```bash
curl -X POST http://localhost:4019/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "category": "plumbing",
    "priority": "high",
    "title": "Leaking faucet in Room 305",
    "description": "Bathroom sink faucet is leaking",
    "reportedBy": "housekeeping",
    "roomId": "305"
  }'
```

### Assign Technician
```bash
curl -X POST http://localhost:4019/api/requests/req-456/assign \
  -H "Content-Type: application/json" \
  -d '{"assignedTo": "tech-789"}'
```

### Complete Request
```bash
curl -X POST http://localhost:4019/api/requests/req-456/complete \
  -H "Content-Type: application/json" \
  -d '{"cost": 150, "notes": "Replaced washer"}'
```

### Add Vendor
```bash
curl -X POST http://localhost:4019/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "name": "Quick Plumbing Co",
    "category": "plumbing",
    "contactName": "John Smith",
    "phone": "+919876543210",
    "email": "john@quickplumbing.com"
  }'
```

## Request Lifecycle

```
pending → assigned → in_progress → completed
    ↓         ↓           ↓
 cancelled  cancelled   cancelled
```

## Architecture

```
rez-hotel-maintenance-service/
├── src/
│   ├── index.ts                    # Express server
│   ├── maintenance.test.ts        # Tests
│   └── services/
│       └── maintenance.service.ts  # Business logic
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Integration

Integrates with:
- REZ PMS Service
- REZ Housekeeping Service
- REZ Staff Scheduling
- REZ Notifications

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4019 | Service port |

## License

Proprietary - RTNM Group

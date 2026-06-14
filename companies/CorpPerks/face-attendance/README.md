# CorpPerks Face Attendance Service

**Port: 4810**

Face recognition attendance and biometric verification for CorpPerks HRMS.

## Overview

Face Attendance Service provides:
- Face recognition check-in/checkout
- Liveness detection (anti-spoofing)
- Geo-location verification
- Overtime tracking
- Department-wise reports

## Features

### Face Recognition
- Face enrollment with embeddings
- Real-time verification
- Cosine similarity matching
- Liveness detection
- Anti-spoofing measures

### Attendance Management
- Check-in / Check-out
- Late detection
- Working hours calculation
- Overtime tracking
- Leave management

### Reporting
- Department-wise reports
- Date range filtering
- Employee attendance history
- Summary statistics

## Quick Start

```bash
cd face-attendance-service
npm install
npm run dev
```

Service runs on **port 4810**.

## API Endpoints

### Attendance
```
POST /api/attendance/checkin          - Check-in
POST /api/attendance/checkout         - Check-out
GET  /api/attendance/today           - Today's attendance
GET  /api/attendance/:employeeId    - History
GET  /api/attendance/report          - Report
```

### Face
```
POST /api/face/verify               - Verify face
POST /api/face/enroll                - Enroll face
DELETE /api/face/:employeeId        - Delete enrollment
```

### Employees
```
GET  /api/employees                  - List employees
GET  /api/employees/:id            - Get employee
POST /api/employees                  - Add employee
```

## Usage Examples

### Check-in with Face Verification
```bash
curl -X POST http://localhost:4810/api/attendance/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP-001",
    "faceEmbedding": [0.123, 0.456, ...],
    "location": {"latitude": 19.076, "longitude": 72.877}
  }'
```

### Enroll Face
```bash
curl -X POST http://localhost:4810/api/face/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP-001",
    "faceEmbedding": [0.123, 0.456, ...],
    "quality": 0.85
  }'
```

### Get Attendance Report
```bash
curl "http://localhost:4810/api/attendance/report?from=2026-06-01&to=2026-06-30&department=Engineering"
```

## Architecture

```
face-attendance-service/
├── src/
│   └── index.ts              # Express server
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

Integrates with:
- CorpPerks HRMS
- RABTUL Notifications (4011)
- Face detection APIs (future)

## License

Proprietary - RTNM Group

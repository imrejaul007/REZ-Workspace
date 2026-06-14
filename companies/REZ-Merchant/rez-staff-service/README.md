# ReZ Staff Service

Staff scheduling and management system for the ReZ restaurant platform.

## Features

- Staff CRUD operations
- Shift management and scheduling
- Attendance tracking with check-in/check-out
- Performance metrics tracking
- AI-powered scheduling optimization

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- TypeScript
- Joi for validation

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+

### Installation

```bash
cd rez-staff-service
npm install
```

### Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Running

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## API Endpoints

### Staff

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/staff | Create staff |
| GET | /api/staff | List staff |
| GET | /api/staff/:id | Get staff by ID |
| PUT | /api/staff/:id | Update staff |
| DELETE | /api/staff/:id | Delete staff |

### Shifts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/shifts | Create shift |
| POST | /api/shifts/bulk | Bulk create shifts |
| GET | /api/shifts/schedule | Get schedule |
| GET | /api/shifts/:id | Get shift by ID |
| PUT | /api/shifts/:id | Update shift |
| DELETE | /api/shifts/:id | Delete shift |
| POST | /api/shifts/swap | Swap shifts |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/attendance/check-in | Check in |
| POST | /api/attendance/check-out | Check out |
| GET | /api/attendance | Get attendance records |
| GET | /api/attendance/date/:date | Get by date |

### Performance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/performance | Create record |
| GET | /api/performance | Get records |
| GET | /api/performance/:id | Get by ID |
| PUT | /api/performance/:id | Update record |

### Schedule

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/schedule/generate | Generate schedule |
| POST | /api/schedule/auto-generate | Auto-generate weekly |
| GET | /api/schedule/optimize/:merchantId | Get staffing recommendations |
| GET | /api/schedule/predict/:merchantId | Predict demand |
| POST | /api/schedule/validate | Validate schedule |

## License

MIT

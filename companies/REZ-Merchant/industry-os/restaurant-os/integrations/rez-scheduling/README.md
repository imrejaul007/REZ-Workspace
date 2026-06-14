# Rez Restaurant Scheduling Service

Staff Scheduling, Attendance, and Payroll Management

**Port:** 4019

## Features

- **Employee Management**: Manage restaurant staff profiles and roles
- **Shift Management**: Create, assign, and manage work shifts
- **Schedule Management**: Weekly/monthly scheduling with conflict detection
- **Attendance Tracking**: Track employee check-in/check-out and working hours
- **Payroll Processing**: Calculate wages based on hours worked and rates
- **Overtime Calculation**: Automatic overtime computation
- **Cron Jobs**: Automated daily attendance processing, monthly payroll reports, shift reminders
- **Rate Limiting**: Built-in protection against API abuse
- **CORS Protection**: Strict cross-origin request handling in production

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/employees | List all employees |
| GET | /api/employees/:id | Get employee by ID |
| POST | /api/employees | Create employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete employee |
| GET | /api/shifts | List all shifts |
| GET | /api/shifts/:id | Get shift by ID |
| POST | /api/shifts | Create shift |
| PUT | /api/shifts/:id | Update shift |
| DELETE | /api/shifts/:id | Delete shift |
| GET | /api/schedules | List schedules |
| POST | /api/schedules | Create schedule |
| PUT | /api/schedules/:id | Update schedule |
| GET | /api/attendance | List attendance records |
| POST | /api/attendance/checkin | Employee check-in |
| POST | /api/attendance/checkout | Employee check-out |
| GET | /api/payroll | List payroll records |
| POST | /api/payroll/generate | Generate payroll |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 4019)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Comma-separated list of allowed origins

## Scheduled Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| Daily midnight | Attendance Processing | Process attendance records, calculate overtime |
| 1st of month | Payroll Report | Generate monthly payroll reports |
| Daily 6 PM | Shift Reminders | Send notifications for next day's shifts |

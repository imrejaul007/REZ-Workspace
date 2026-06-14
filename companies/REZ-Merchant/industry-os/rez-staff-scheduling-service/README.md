# Rez Staff Scheduling Service

Staff Shift Management, Time Tracking, and Payroll

**Port:** 4036

## Features

- **Staff Management**: Manage hotel staff profiles with department and role assignments
- **Shift Templates**: Define reusable shift templates with times, breaks, and department association
- **Schedule Management**: Create and manage staff schedules with bulk scheduling support
- **Time Tracking**: Clock-in/clock-out tracking with automatic hour calculation
- **Overtime Calculation**: Automatic overtime computation (hours beyond 8 hours)
- **Leave Management**: Sick, personal, vacation, and emergency leave requests
- **Leave Approval**: Approve or reject leave requests
- **Payroll Processing**: Calculate wages based on hours worked, overtime, and hourly rates
- **Department Support**: Front desk, housekeeping, kitchen, maintenance, management, spa, restaurant
- **Wage Types**: Support for both hourly and salary staff

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/staff | Create staff member |
| GET | /api/staff/:hotelId | List staff (filter by department) |
| POST | /api/shift-templates | Create shift template |
| GET | /api/shift-templates/:hotelId | List shift templates |
| POST | /api/schedule | Create single schedule |
| POST | /api/schedule/bulk | Bulk create schedules |
| GET | /api/schedule/:hotelId | Get schedules (by date/staff) |
| POST | /api/time/clock-in | Clock in staff member |
| POST | /api/time/clock-out | Clock out and calculate hours |
| GET | /api/time/:hotelId | Get time entries |
| POST | /api/leave | Submit leave request |
| GET | /api/leave/:hotelId | Get leave requests |
| POST | /api/leave/:leaveId/approve | Approve leave request |
| GET | /api/payroll/:hotelId | Generate payroll report |

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
- `PORT`: Server port (default: 4036)
- `MONGO_URL`: MongoDB connection string

## Departments

- front_desk
- housekeeping
- kitchen
- maintenance
- management
- spa
- restaurant

## Wage Calculation

- Regular hours: First 8 hours per shift at base rate
- Overtime: Hours beyond 8 hours at 1.5x base rate
- Default hourly rate: 100 (configurable per staff member)

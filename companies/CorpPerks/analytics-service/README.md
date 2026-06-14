# CorpPerks Analytics Service

HR Analytics service for CorpPerks workforce management platform.

## Features

- Dashboard metrics (employees, attendance, payroll, performance)
- Employee analytics (headcount, demographics, attrition)
- Attendance analytics (trends, department-wise, patterns)
- Payroll analytics (compensation, deductions, compliance)
- Performance analytics (scores, trends, goals)
- Scheduled report generation (daily, weekly, monthly, quarterly)

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/CorpPerks/analytics-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

## Configuration

Create `.env` with:

```env
PORT=4744
MONGODB_URI=mongodb://localhost:27017/corpperks-analytics
INTERNAL_SERVICE_TOKEN=your-internal-service-token
```

## API Endpoints

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Main dashboard metrics |
| GET | `/api/analytics/employees` | Employee metrics |
| GET | `/api/analytics/attendance` | Attendance analytics |
| GET | `/api/analytics/payroll` | Payroll analytics |
| GET | `/api/analytics/performance` | Performance metrics |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/schedule` | Schedule a report |
| GET | `/api/reports/scheduled` | List scheduled reports |
| GET | `/api/reports/scheduled/:id` | Get scheduled report |
| PATCH | `/api/reports/scheduled/:id` | Update scheduled report |
| DELETE | `/api/reports/scheduled/:id` | Delete scheduled report |
| GET | `/api/reports/history` | Report generation history |
| GET | `/api/reports/:id` | Get specific report |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health status |

## Authentication

Use `X-Internal-Token` header for service-to-service calls:

```bash
curl -H "X-Internal-Token: your-token" http://localhost:4744/api/analytics/dashboard
```

## Query Parameters

### Dashboard
- `startDate` - ISO date string
- `endDate` - ISO date string
- `department` - Filter by department

### Attendance
- `startDate` - Required, ISO date string
- `endDate` - Required, ISO date string
- `department` - Filter by department
- `employeeId` - Filter by employee
- `groupBy` - day, week, or month

### Payroll
- `startDate` - Required, ISO date string
- `endDate` - Required, ISO date string
- `department` - Filter by department
- `employeeId` - Filter by employee
- `includeDeductions` - true/false

## Scheduled Reports

Schedule formats:
- `daily` - Every day at specified time
- `weekly` - Every week on specified day
- `monthly` - Every month on specified date
- `quarterly` - Every quarter on specified date

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB (Mongoose)
- Zod (validation)
- Winston (logging)
- node-cron (scheduling)

## Port

```
4744
```

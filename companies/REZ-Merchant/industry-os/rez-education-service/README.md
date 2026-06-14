# ReZ Education Service

A merchant-facing microservice for educational institutions including coaching centers, tuition centers, and training institutes. This service manages courses, batches, students, attendance, and fees.

## Features

- **Course Management**: Create and manage courses with syllabus, schedule, pricing, and prerequisites
- **Batch Management**: Organize batches within courses with enrollment limits and fee structures
- **Student Management**: Track student enrollment, attendance rates, and payment status
- **Attendance Tracking**: Mark and report student attendance with check-in/check-out times
- **Enrollment Service**: Handle student enrollment with batch capacity management
- **Attendance Service**: Process attendance records with various status types

## Service Configuration

- **Port**: 4054
- **Base URL**: `http://localhost:4054`
- **Health Check**: `http://localhost:4054/health`

## API Endpoints

### Courses
- `POST /api/courses` - Create a new course
- `GET /api/courses` - List/search courses
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `PATCH /api/courses/:id/status` - Update course status

### Batches
- `POST /api/batches` - Create a new batch
- `GET /api/batches` - List/search batches
- `GET /api/batches/:id` - Get batch by ID
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch
- `POST /api/batches/:id/enroll` - Enroll student in batch
- `GET /api/batches/:id/students` - Get students in batch

### Students
- `POST /api/students` - Create a new student
- `GET /api/students` - List/search students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/attendance` - Get student attendance history
- `PATCH /api/students/:id/status` - Update student status

### Attendance
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - List attendance records
- `GET /api/attendance/batch/:batchId` - Get batch attendance
- `GET /api/attendance/report/:batchId` - Get attendance report
- `PUT /api/attendance/:id` - Update attendance record

## Installation

```bash
npm install
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4054 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/rez-education |
| JWT_SECRET | JWT authentication secret | - |
| NODE_ENV | Environment mode | development |
| CORS_ORIGIN | Allowed CORS origins (comma-separated) | - |

## Authentication

All API endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

JWT Payload structure:
```json
{
  "sub": "user-id",
  "merchantId": "merchant-id",
  "role": "admin|teacher|staff",
  "email": "user@example.com",
  "exp": 1234567890
}
```

## Data Models

### Course
- Course ID, name, description, category
- Duration (weeks/months), batch size, price
- Schedule, syllabus, prerequisites
- Status: active/draft/inactive

### Batch
- Batch ID, course reference, name
- Instructor, dates, schedule
- Max students, enrolled count
- Fees, payment plan

### Student
- Student ID, name, contact info
- Parent/guardian contacts
- Enrollment date, status
- Attendance rate, payment status

### Attendance
- Attendance ID, batch/student references
- Date, status (present/absent/late/excused)
- Check-in/check-out times
- Marked by, notes

## License

Proprietary - ReZ Platform
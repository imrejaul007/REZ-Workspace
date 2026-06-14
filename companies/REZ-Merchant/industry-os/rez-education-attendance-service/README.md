# REZ Education Attendance Service

**Port: 4502**

Student attendance tracking for educational institutions.

## Features

- Daily attendance marking
- Student attendance history
- Attendance reports
- Leave management

## API Endpoints

- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - List attendance records
- `GET /api/attendance/student/:studentId` - Student attendance
- `GET /api/attendance/batch/:batchId` - Batch attendance
- `GET /api/attendance/report/:studentId` - Generate report

## Environment Variables

```
PORT=4502
MONGODB_URI=mongodb://localhost:27017/rez_education_attendance
```

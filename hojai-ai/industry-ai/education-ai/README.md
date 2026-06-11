# Education AI - Educational Institutions AI Operating System

> "AI-Powered Learning Management"

**Version:** 1.0.0 | **Port:** 4050 | **Company:** HOJAI-AI

Education AI is a comprehensive AI operating system for educational institutions. It combines student management, course tracking, enrollment handling, assignment management, and academic analytics to streamline educational operations.

## Features

### AI Employees

| AI Employee | Description | Capabilities |
|------------|-------------|---------------|
| **AI Tutor** | Personalized learning assistance | Course recommendations, study plans, progress tracking |
| **Grade Advisor** | Academic performance analysis | GPA calculation, grade predictions, improvement suggestions |
| **Attendance Tracker** | Smart attendance management | Check-in/out, absence alerts, reporting |

### Core Features

- **Student Management** - Registration, profiles, academic records, attendance tracking
- **Course Management** - Course creation, scheduling, capacity management, materials
- **Enrollment System** - Student enrollment, course capacity enforcement, status tracking
- **Assignment Management** - Assignment creation, submission tracking, grading
- **Announcements** - Course announcements with priority levels
- **Academic Analytics** - GPA tracking, enrollment rates, attendance reports

### Data Models

| Model | Fields | Purpose |
|-------|--------|---------|
| Student | studentId, name, email, gradeLevel, gpa, attendance, enrolledCourses | Student records |
| Course | courseId, name, description, instructor, credits, enrolledStudents, schedule, capacity | Course management |
| Enrollment | enrollmentId, studentId, courseId, status, grade, enrolledAt | Student-course linking |
| Assignment | assignmentId, courseId, title, description, dueDate, maxPoints, submissions | Assignment tracking |
| Announcement | announcementId, courseId, title, content, priority, postedAt | Course communications |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB with Mongoose |
| Authentication | JWT |
| Validation | Zod |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Winston, Morgan |
| Configuration | dotenv |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```bash
# Server
PORT=4050
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/education_ai

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Health Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check with MongoDB status |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate and get JWT token |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create new student |
| GET | `/api/students/:id` | Get student by ID |
| GET | `/api/students/:id/report` | Get student academic report |
| PUT | `/api/students/:id/attendance` | Update student attendance |
| GET | `/api/students/:studentId/courses` | Get student's enrolled courses |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all active courses |
| POST | `/api/courses` | Create new course |
| GET | `/api/courses/:id` | Get course by ID |
| PUT | `/api/courses/:id/materials` | Add course material |
| GET | `/api/courses/:courseId/students` | Get enrolled students |
| GET | `/api/courses/:courseId/assignments` | Get course assignments |

### Enrollments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/enrollments` | List all enrollments |
| POST | `/api/enrollments` | Enroll student in course |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List all assignments |
| POST | `/api/assignments` | Create new assignment |
| POST | `/api/assignments/:id/submit` | Submit assignment |

### Announcements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | List all announcements |
| POST | `/api/announcements` | Create new announcement |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get education statistics |

## Architecture

```
education-ai/
├── src/
│   ├── index.ts          # Main entry point
│   ├── config.ts         # Configuration
│   ├── types/            # TypeScript types
│   ├── models/           # MongoDB schemas
│   ├── middleware/       # Auth, logging, error handling
│   ├── services/         # Business logic (AI employees)
│   └── routes/           # REST API endpoints
├── .env.example
├── package.json
└── tsconfig.json
```

## Documentation

- [API Documentation](API.md) - Complete API reference
- [State of Technology](SOT.md) - Technical specification
- [Developer Guide](CLAUDE.md) - Development documentation
- [Product Overview](PRODUCT.md) - Product requirements

## Pricing

| Plan | Price | Target |
|------|-------|--------|
| HOJAI AI | 4,999/month | Non-REZ clients |
| REZ-Merchant OS | Included | REZ ecosystem clients |

## Support

For technical support: **support@hojai.ai**

## License

Proprietary - HOJAI AI

---

**Company:** HOJAI-AI
**Category:** Industry AI
**Industry:** Education
**Status:** Production Ready
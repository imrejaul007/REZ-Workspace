# LEARNIQ - Education AI Operating System

An AI-powered education management platform featuring intelligent agents for personalized learning, enrollment processing, career guidance, and assessment scoring.

## Features

- **Tutor Agent** - Personalized learning recommendations and study plans
- **Admission Agent** - Automated enrollment processing and eligibility verification
- **Placement Agent** - Career guidance and job matching
- **Grader Agent** - Intelligent assessment scoring and feedback

## Tech Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Zod Validation
- Winston Logging
- Helmet Security
- Rate Limiting

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=4811
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/learniq
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

### Test

```bash
npm test
```

## API Endpoints

### AI Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ai/status | Get all AI agent status |
| POST | /api/ai/tutor/recommend | Get course recommendations |
| POST | /api/ai/admission/process | Process enrollment |
| POST | /api/ai/placement/analyze | Career analysis |
| POST | /api/ai/grader/calculate | Calculate grades |

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/students | Create student |
| GET | /api/students | List students |
| GET | /api/students/:id | Get student |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Delete student |

### Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/courses | Create course |
| GET | /api/courses | List courses |
| GET | /api/courses/:id | Get course |
| PUT | /api/courses/:id | Update course |
| DELETE | /api/courses/:id | Delete course |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/attendance | Mark attendance |
| GET | /api/attendance/:courseId | Get course attendance |
| POST | /api/attendance/bulk | Bulk mark attendance |

### Grades

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/grades | Create grade |
| GET | /api/grades/:studentId | Get student grades |
| GET | /api/grades/course/:courseId | Get course grades |
| GET | /api/grades/gpa/:studentId | Get student GPA |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/dashboard | Dashboard data |
| GET | /api/analytics/student/:id | Student analytics |
| GET | /api/analytics/course/:id | Course analytics |

## Health Checks

- `/health` - Application health
- `/ready` - Readiness probe

## License

MIT

# EduLearn - Education AI Platform

**Port:** 4133
**Industry:** Education / EdTech
**Competitors:** BYJU'S AI, Khan Academy, Coursera, Unacademy
**Version:** 2.0.0

---

## Overview

EduLearn is an AI-powered education operating system that provides adaptive learning, student analytics, assessment optimization, and personalized study plans. It uses GPT-4 to generate content, analyze performance, and create customized learning experiences.

### Key Features

- **Adaptive Learning** - Personalized course recommendations based on student profile
- **AI Content Generation** - Generate lessons, worksheets, quizzes, and study notes
- **Performance Analytics** - Deep analysis of student progress and engagement
- **Smart Assessments** - AI-generated questions with Bloom's taxonomy
- **Study Plan Generation** - Personalized 4-week learning plans
- **Dropout Prediction** - Early intervention for at-risk students
- **Class Analytics** - Overall class performance insights

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         EDULEARN (Port 4133)                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                        AI BRAIN LAYER                                 │ │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐  │ │
│  │  │ Adaptive       │ │ Content        │ │ Performance           │  │ │
│  │  │ Recommendations│ │ Generation     │ │ Analysis             │  │ │
│  │  └────────────────┘ └────────────────┘ └────────────────────────┘  │ │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐  │ │
│  │  │ Assessment     │ │ Study Plan     │ │ Class                │  │ │
│  │  │ Generation     │ │ Generation     │ │ Analytics            │  │ │
│  │  └────────────────┘ └────────────────┘ └────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│  ┌─────────────────────────────────┼────────────────────────────────────┐│
│  │                                 │                                    │ │
│  ▼                                 ▼                                    ▼ │
│ ┌──────────┐          ┌──────────────────┐          ┌──────────────┐   │
│ │  RABTUL │          │ REZ-Intelligence │          │    HOJAI     │   │
│ ├──────────┤          ├──────────────────┤          ├──────────────┤   │
│ │Auth 4002│          │ Intent Graph     │          │  AI Brain    │   │
│ │Wallet   │          │ Predictions      │          │  Memory      │   │
│ │4004     │          │ 4018            │          │  4800        │   │
│ └──────────┘          └──────────────────┘          └──────────────┘   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                       DATA LAYER                                       │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│ │
│  │  │Student  │ │ Course  │ │Assessment│ │Learning │ │    Content      ││ │
│  │  │ Model   │ │ Model   │ │  Model  │ │  Path   │ │     Model       ││ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘│ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Navigate to service directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/hojai-ai/industry-ai/edulearn

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Server running on http://localhost:4133
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4133
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/edulearn

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# OpenAI (optional - uses mock mode if not set)
OPENAI_API_KEY=sk-your-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## API Endpoints

### Health & Status

```bash
GET  /health              # Service health check
GET  /health/live         # Liveness probe
GET  /health/ready        # Readiness probe
GET  /api/ai/status       # AI brain status
```

### Authentication

```bash
POST /api/auth/login      # Login and get JWT token
```

### Students

```bash
GET    /api/students                    # List all students
POST   /api/students                    # Enroll new student
GET    /api/students/:id                # Get student profile
GET    /api/students/:id/progress       # Get learning progress
POST   /api/students/:id/plan           # Generate learning plan
```

### Courses

```bash
GET    /api/courses                    # List all courses
GET    /api/courses/:id                # Get course details
```

### Assessments

```bash
GET    /api/assessments                # List all assessments
POST   /api/assessments                # Create new assessment
POST   /api/assessments/:id/grade     # Grade assessment
```

### AI Features (GPT-4 Powered)

```bash
GET  /api/ai/recommendations/:studentId    # Adaptive recommendations
POST /api/ai/content/generate              # Generate course content
POST /api/ai/performance/analyze           # Analyze student performance
POST /api/ai/assessment/generate           # Generate assessments
POST /api/ai/study-plan/generate          # Generate study plan
GET  /api/ai/insights/:studentId          # Get learning insights
GET  /api/ai/class-analytics              # Get class analytics
```

### Predictive Analytics

```bash
GET /api/predict/dropout       # Dropout risk prediction
GET /api/predict/performance   # Performance forecast
```

---

## API Examples

### 1. Login and Get Token

```bash
curl -X POST http://localhost:4133/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

### 2. Enroll a Student

```bash
curl -X POST http://localhost:4133/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "grade": "10th"
  }'
```

### 3. Get Adaptive Recommendations (AI)

```bash
curl -X GET http://localhost:4133/api/ai/recommendations/student_1234567890 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "courseId": "science-101",
      "courseName": "Science 101",
      "reason": "Builds on your strengths in problem-solving",
      "priority": "high",
      "confidence": 0.87,
      "estimatedTime": "45 minutes",
      "learningObjectives": [
        "Understand Science 101 fundamentals",
        "Apply concepts to real-world problems",
        "Achieve proficiency by end of course"
      ]
    }
  ],
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "model": "gpt-4"
  }
}
```

### 4. Generate Course Content (AI)

```bash
curl -X POST http://localhost:4133/api/ai/content/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topic": "Photosynthesis",
    "subject": "Biology",
    "gradeLevel": "10th",
    "format": "lesson",
    "duration": 60
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "title": "Understanding Photosynthesis - Biology Lesson",
    "content": "# Photosynthesis\n\n## Learning Objectives...",
    "learningObjectives": [
      "Understand the fundamentals of Photosynthesis",
      "Apply Photosynthesis to solve problems",
      "Analyze real-world applications of Photosynthesis"
    ],
    "keyConcepts": ["Photosynthesis", "Photosynthesis principles"],
    "activities": ["Group discussion", "Problem-solving exercise"],
    "assessments": ["Quiz", "Worksheet", "Project"],
    "resources": [
      {"title": "Photosynthesis - Khan Academy", "url": "https://khanacademy.org/..."}
    ],
    "metadata": {
      "generatedAt": "2024-01-15T10:30:00.000Z",
      "format": "lesson",
      "estimatedMinutes": 60
    }
  }
}
```

### 5. Analyze Student Performance (AI)

```bash
curl -X POST http://localhost:4133/api/ai/performance/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "student_1234567890"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "studentId": "student_1234567890",
    "overallScore": 82,
    "grade": "A",
    "trend": "improving",
    "strengths": [
      {"area": "Mathematics", "score": 92},
      {"area": "Science", "score": 88}
    ],
    "weaknesses": [
      {"area": "Language Arts", "score": 68},
      {"area": "History", "score": 72}
    ],
    "recommendations": [
      "Focus more time on Language Arts to improve overall grade",
      "Complete all assignments on time to boost participation score"
    ],
    "predictedNextScore": 87,
    "confidence": 0.85,
    "engagementMetrics": {
      "averageTimeSpent": 52,
      "assignmentCompletionRate": 85,
      "participationScore": 78
    }
  }
}
```

### 6. Generate Assessment (AI)

```bash
curl -X POST http://localhost:4133/api/ai/assessment/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topic": "Quadratic Equations",
    "subject": "Mathematics",
    "questionCount": 10,
    "difficulty": "medium",
    "questionTypes": ["mcq", "short"],
    "includeAnswers": true,
    "timeLimit": 30
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "assessmentId": "assessment_1705312200000",
    "title": "Quadratic Equations Assessment - Mathematics",
    "questions": [
      {
        "question": "1. Question about Quadratic Equations (Apply level)",
        "type": "mcq",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option C",
        "explanation": "This answer is correct because...",
        "difficulty": "medium",
        "topic": "Quadratic Equations",
        "bloomsLevel": "Apply"
      }
    ],
    "metadata": {
      "generatedAt": "2024-01-15T10:30:00.000Z",
      "difficulty": "medium",
      "estimatedTime": 30,
      "totalMarks": 40
    }
  }
}
```

### 7. Generate Study Plan (AI)

```bash
curl -X POST http://localhost:4133/api/ai/study-plan/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "student_1234567890",
    "goals": ["Mathematics", "Science", "English"],
    "availableTimePerWeek": 300,
    "preferredLearningStyle": "visual",
    "deadline": "2024-02-15"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "planId": "plan_1705312200000",
    "studentId": "student_1234567890",
    "duration": 4,
    "dailySchedule": [
      {
        "day": "Monday",
        "sessions": [
          {
            "subject": "Mathematics",
            "topic": "Practice math problems - 30 min",
            "duration": 30,
            "activity": "Watch video tutorial",
            "resources": ["Khan Academy", "YouTube", "Practice worksheets"]
          }
        ]
      }
    ],
    "milestones": [
      {
        "week": 1,
        "target": "Complete introduction to all topics",
        "completionCriteria": ["Review all topic basics"]
      }
    ],
    "estimatedProgress": {
      "week1": "15% completion - Foundation building",
      "week2": "35% completion - Knowledge expansion",
      "week3": "60% completion - Skill development",
      "week4": "85% completion - Mastery and review"
    },
    "recommendations": [
      "Take short breaks every 25 minutes (Pomodoro technique)"
    ],
    "motivationTips": ["Set small, achievable daily goals"]
  }
}
```

### 8. Get Student Insights (AI)

```bash
curl -X GET http://localhost:4133/api/ai/insights/student_1234567890 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Get Class Analytics (AI)

```bash
curl -X GET http://localhost:4133/api/ai/class-analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 10. Predict Dropout Risk

```bash
curl -X GET "http://localhost:4133/api/predict/dropout?studentId=student_1234567890" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Data Models

### Student
```typescript
{
  studentId: string;          // Unique ID
  name: string;               // Full name
  email: string;             // Email address
  grade?: string;             // Grade/class
  status: 'active' | 'inactive' | 'graduated';
  enrolledCourses: string[];   // Course IDs
  progress: Map<string, number>; // courseId -> percentage
  strengths: string[];       // Strong areas
  areasForImprovement: string[];
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
}
```

### Course
```typescript
{
  courseId: string;           // Unique ID
  name: string;              // Course name
  subject: string;            // Subject area
  gradeLevel: string;         // Target grade
  duration: number;           // Duration in minutes
  modules: number;            // Number of modules
  isActive: boolean;
  prerequisites: string[];    // Required course IDs
  tags: string[];
}
```

### Assessment
```typescript
{
  assessmentId: string;
  title: string;
  courseId: string;
  questions: IQuestion[];
  type: 'quiz' | 'exam' | 'assignment' | 'test';
  difficulty: 'easy' | 'medium' | 'hard';
  totalMarks: number;
  timeLimit?: number;        // In minutes
  results: Map<studentId, Result>;
}
```

---

## AI Brain Capabilities

### 1. Adaptive Recommendations
- Analyzes student profile, strengths, and weaknesses
- Recommends courses that address learning gaps
- Prioritizes recommendations by relevance
- Includes confidence scores for each recommendation

### 2. Content Generation
Supports multiple formats:
- **Lesson Plans** - Objectives, activities, assessments
- **Worksheets** - Practice exercises with answer keys
- **Quizzes** - Multiple choice and short answer
- **Study Notes** - Key points and examples

### 3. Performance Analysis
- Overall score and grade calculation
- Trend analysis (improving/declining/stable)
- Strength/weakness identification by area
- Engagement metrics tracking
- Predicted next score with confidence

### 4. Assessment Generation
- Bloom's Taxonomy levels (Remember, Understand, Apply, Analyze, Evaluate, Create)
- Multiple question types (MCQ, short answer, long answer, true/false)
- Configurable difficulty and time limits
- Detailed explanations for each answer

### 5. Study Plan Generation
- Personalized 4-week curriculum
- Daily schedule with sessions
- Learning style adaptation
- Milestones and completion criteria
- Motivation tips and recommendations

---

## Pricing Tiers

| Tier | Price | Students | Features |
|------|-------|----------|----------|
| **Starter** | ₹2,999/mo | 100 | Basic analytics, manual assessments |
| **Growth** | ₹9,999/mo | 1,000 | AI recommendations, adaptive learning |
| **Enterprise** | ₹29,999/mo | Unlimited | Full AI suite, custom integrations |

---

## Ecosystem Integrations

### RABTUL (Financial Infrastructure)
- **Auth** (Port 4002) - Student login and authentication
- **Wallet** (Port 4004) - Course payments, subscriptions
- **Notifications** (Port 4011) - Progress alerts, reminders

### REZ-Intelligence (AI/ML Platform)
- **Intent Graph** (Port 4018) - Learning style prediction
- **Recommendations** - Course suggestions based on intent
- **Analytics** - Performance trend analysis

### HOJAI (AI Services)
- **AI Brain** (Port 4800) - GPT-4 powered features
- **Memory Platform** - Student learning history
- **Knowledge Graph** - Education domain knowledge

---

## Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use Docker
docker build -t edulearn .
docker run -p 4133:4133 edulearn
```

---

## Testing

```bash
# Run tests with coverage
npm test

# Run tests in watch mode
npm test -- --watch
```

---

## Project Structure

```
edulearn/
├── src/
│   ├── index.ts           # Main server (routes, middleware)
│   ├── models/
│   │   └── index.ts      # MongoDB schemas
│   └── services/
│       └── aiBrain.ts     # AI brain with GPT-4
├── .env.example          # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| express | HTTP server |
| mongoose | MongoDB ODM |
| openai | GPT-4 integration |
| winston | Logging |
| jsonwebtoken | JWT auth |
| helmet | Security headers |
| zod | Validation |
| prom-client | Prometheus metrics |

---

## License

Proprietary - HOJAI AI

---

**Built with:** HOJAI Core, OpenAI GPT-4, MongoDB
**Company:** HOJAI-AI
**Version:** 2.0.0
**Last Updated:** June 2024

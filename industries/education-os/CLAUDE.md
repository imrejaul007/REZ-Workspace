# Education OS - Learning Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5060  
**Location:** `industries/education-os/`

## Overview

Education OS provides a comprehensive platform for educational institutions, connecting courses, students, teachers, and institutions with AI-powered learning analytics and automation.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Course Twin** | Course content, curriculum | Syllabi, materials |
| **Student Twin** | Learning profiles, progress | Performance tracking |
| **Teacher Twin** | Instructor management | Schedule, evaluations |
| **Institution Twin** | School/department info | Enrollment, capacity |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Enrollment Agent** | Student registration, placement |
| **Grading Agent** | Assignment evaluation, feedback |
| **Attendance Agent** | Attendance tracking, alerts |
| **LearningAnalytics Agent** | Performance insights |
| **Tutoring Agent** | Personalized learning support |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | - | Health check |
| `GET /api/twins` | GET | List all twins |
| `GET /api/twins/course/:id` | GET | Get course twin |
| `GET /api/twins/student/:id` | GET | Get student twin |
| `GET /api/twins/teacher/:id` | GET | Get teacher twin |
| `GET /api/agents` | GET | List all agents |
| `POST /api/courses` | POST | Create course |
| `GET /api/courses/:id` | GET | Get course |
| `POST /api/students` | POST | Enroll student |
| `GET /api/students/:id` | GET | Get student |
| `POST /api/teachers` | POST | Add teacher |
| `GET /api/grades/:studentId` | GET | Get grades |

## Quick Start

```bash
cd industries/education-os && npm install && node src/index.js

# Health check
curl http://localhost:5060/health

# Create course
curl -X POST http://localhost:5060/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Introduction to AI", "credits": 3, "instructor": "Dr. Smith"}'

# Enroll student
curl -X POST http://localhost:5060/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@student.edu", "year": "sophomore"}'
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Education Agent available via AgentOS
- Learning content via Genie memory
- Analytics integrate with BOA

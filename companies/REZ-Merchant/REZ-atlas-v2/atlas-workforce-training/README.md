# Atlas Workforce Training

**Port:** 5235 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Continuous learning and skill development platform for field sales teams. AI-powered course generation, assessments, and certification tracking.

## Features

- **Course Management** - Create and manage training courses
- **Assessments** - Automated testing and scoring
- **Certification Tracking** - Track employee certifications
- **AI Content Generation** - Auto-generate training content

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/:id` | Get course details |
| POST | `/api/courses` | Create new course |
| GET | `/api/assessments/:courseId` | Get course assessments |

## Quick Start

```bash
cd atlas-workforce-training
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5235/health
```

## Ecosystem Integration

- **atlas-workforce-core** - Employee progress tracking
- **HOJAI AI** - Content generation

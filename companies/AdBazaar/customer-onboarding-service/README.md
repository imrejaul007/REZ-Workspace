# Customer Onboarding Service

Guided onboarding workflows and checklists for AdBazaar.

## Overview

This service provides comprehensive customer onboarding management, including customizable checklists, task tracking, and progress monitoring to ensure successful customer activation.

## Features

- **Customizable Checklists**: Pre-built templates for different customer types
- **Task Management**: Track individual task completion and dependencies
- **Progress Tracking**: Real-time progress monitoring with metrics
- **Timeline Management**: Due dates and overdue tracking
- **Progress History**: Complete audit trail of onboarding activities

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/onboarding` | Create new onboarding |
| GET | `/api/onboarding/:id` | Get onboarding by ID |
| PUT | `/api/onboarding/:id` | Update onboarding |
| POST | `/api/onboarding/:id/progress` | Update task progress |
| GET | `/api/onboarding/:id/checklist` | Get checklist for onboarding |
| GET | `/api/onboarding` | Get all onboardings |

## Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5077 | Service port |
| MONGODB_URI | mongodb://localhost:27017/adbazaar_onboarding | MongoDB connection |
| LOG_LEVEL | info | Logging level |

## Port

**Port: 5077**
# Journey Orchestrator

Customer journey automation service for AdBazaar.

## Features

- Multi-step journey creation
- Trigger-based automation
- Branching and conditions
- Wait/delay steps
- Action steps (email, SMS, push)
- Enrollment management
- Real-time journey tracking

## Port

**5035**

## API Endpoints

### Journeys
- `POST /api/journeys` - Create journey
- `GET /api/journeys` - List journeys
- `GET /api/journeys/:id` - Get journey details
- `PUT /api/journeys/:id` - Update journey
- `DELETE /api/journeys/:id` - Delete journey
- `POST /api/journeys/:id/trigger` - Trigger journey
- `GET /api/journeys/:id/analytics` - Get journey analytics

### Steps
- `POST /api/journeys/:id/steps` - Add step to journey
- `PUT /api/steps/:id` - Update step
- `DELETE /api/steps/:id` - Delete step

### Enrollments
- `POST /api/enrollments` - Enroll contact in journey
- `GET /api/enrollments` - List enrollments
- `GET /api/enrollments/:id` - Get enrollment details
- `DELETE /api/enrollments/:id` - Cancel enrollment

### Triggers
- `POST /api/triggers` - Create trigger
- `GET /api/triggers` - List triggers
- `PUT /api/triggers/:id` - Update trigger

## Models

### Journey
- journeyId: string
- advertiserId: string
- name: string
- description: string
- status: draft | active | paused | completed
- trigger: { type, conditions }
- entryCriteria: object
- exitCriteria: object
- steps: Step[]
- stats: { enrolled, completed, dropped }

### Step
- stepId: string
- journeyId: string
- type: trigger | action | condition | wait | end
- name: string
- config: object
- order: number

### Trigger
- triggerId: string
- journeyId: string
- type: form_submit | email_open | page_visit | time | score_threshold
- conditions: object[]
- action: string

### Enrollment
- enrollmentId: string
- journeyId: string
- contactId: string
- status: active | completed | exited | paused
- currentStep: number
- startedAt: Date
- completedAt: Date
- metadata: object

## Quick Start

```bash
cd journey-orchestrator
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5035/health
```

## Environment Variables

```
PORT=5035
MONGODB_URI=mongodb://localhost:27017/journey_orchestrator
INTERNAL_SERVICE_TOKEN=your-token
```
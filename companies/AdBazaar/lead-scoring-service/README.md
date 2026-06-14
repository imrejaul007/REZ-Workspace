# Lead Scoring Service

Lead scoring and qualification service for AdBazaar.

## Features

- Lead capture and management
- Behavioral and demographic scoring
- Lead qualification rules
- Priority-based lead routing
- Real-time score updates
- Analytics and reporting

## Port

**5034**

## API Endpoints

### Leads
- `POST /api/leads` - Create lead
- `GET /api/leads` - List leads
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/score` - Recalculate lead score
- `GET /api/leads/:id/analytics` - Get lead analytics

### Scoring Rules
- `POST /api/rules` - Create scoring rule
- `GET /api/rules` - List scoring rules
- `PUT /api/rules/:id` - Update scoring rule
- `DELETE /api/rules/:id` - Delete scoring rule

### Activities
- `POST /api/activities` - Log lead activity
- `GET /api/activities` - List activities

## Models

### Lead
- leadId: string
- advertiserId: string
- email: string
- phone: string
- firstName: string
- lastName: string
- company: string
- source: string
- status: new | contacted | qualified | nurturing | converted | lost
- score: number
- grade: A | B | C | D
- priority: hot | warm | cold
- scores: { behavioral, demographic, engagement }
- metadata: object

### Score
- scoreId: string
- leadId: string
- totalScore: number
- behavioralScore: number
- demographicScore: number
- engagementScore: number
- factors: object[]
- calculatedAt: Date

### Activity
- activityId: string
- leadId: string
- type: page_view | email_open | email_click | form_submit | call | meeting
- metadata: object
- scoreImpact: number

## Quick Start

```bash
cd lead-scoring-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5034/health
```

## Environment Variables

```
PORT=5034
MONGODB_URI=mongodb://localhost:27017/lead_scoring
INTERNAL_SERVICE_TOKEN=your-token
```
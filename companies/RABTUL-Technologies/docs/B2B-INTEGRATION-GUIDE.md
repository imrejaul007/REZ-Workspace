# REZ B2B Revenue OS - Integration Guide

**Version:** 1.0.0  
**Last Updated:** June 2, 2026

---

## Overview

REZ B2B Revenue OS is a complete B2B sales intelligence platform built to compete with Monaco AI Revenue OS. This guide covers integration with all services.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REZ B2B REVENUE OS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        B2B Gateway (4138)                           │   │
│   │              Unified API + Cross-Service Queries                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│         ┌────────────────────────────┼────────────────────────────┐       │
│         │                            │                            │       │
│         ▼                            ▼                            ▼       │
│   ┌───────────┐              ┌───────────┐              ┌───────────┐  │
│   │ TAM       │              │ Signal    │              │ Outbound  │  │
│   │ Builder   │              │ Service   │              │ Service   │  │
│   │ (4128)   │              │ (4129)    │              │ (4130)    │  │
│   └───────────┘              └───────────┘              └───────────┘  │
│         │                            │                            │       │
│         │                            │                            │       │
│         ▼                            ▼                            ▼       │
│   ┌───────────┐              ┌───────────┐              ┌───────────┐  │
│   │ Deal      │              │ Activity  │              │ Meeting   │  │
│   │ Intelli.  │              │ Service   │              │ Notes     │  │
│   │ (4131)    │              │ (4132)    │              │ (4133)    │  │
│   └───────────┘              └───────────┘              └───────────┘  │
│         │                            │                            │       │
│         │                            │                            │       │
│         ▼                            ▼                            ▼       │
│   ┌───────────┐              ┌───────────┐              ┌───────────┐  │
│   │ Buyer     │              │ Personal.  │              │ AI CRM    │  │
│   │ Mapping   │              │ Engine    │              │ Updates   │  │
│   │ (4134)    │              │ (4135)    │              │ (4136)    │  │
│   └───────────┘              └───────────┘              └───────────┘  │
│                                                                             │
│         ┌─────────────────────────────────────────────────────────────┐   │
│         │               Pipeline Suggestions (4137)                      │   │
│         └─────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Services Overview

| Port | Service | Description | Monaco Equivalent |
|------|---------|-------------|-------------------|
| 4128 | TAM Builder | ICP & Account Universe | TAM Builder |
| 4129 | Signal Service | Intent Signal Detection | Signals Engine |
| 4130 | Outbound Service | Multi-channel Sequences | Outbound |
| 4131 | Deal Intelligence | Deal Scoring & Predictions | Deal Intelligence |
| 4132 | Activity Service | Unified Activity Tracking | Activity Tracking |
| 4133 | Meeting Notes | Meeting Intelligence | Meeting Intelligence |
| 4134 | Buyer Mapping | Persona & Decision Maker | Buyer Mapping |
| 4135 | Personalization | Dynamic Content | Personalization |
| 4136 | AI CRM Updates | Auto CRM Updates | AI CRM |
| 4137 | Pipeline Suggestions | Forecasting | Pipeline AI |
| 4138 | B2B Gateway | Unified API | (REZ Unique) |

## Quick Start

### 1. Install the SDK

```bash
npm install @rez/b2b-types axios
```

### 2. Configure Gateway

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4138',
  headers: {
    'x-tenant-id': 'your-tenant-id',
    'Content-Type': 'application/json'
  }
});
```

### 3. Start Using Services

```typescript
// Get complete account view
const { data } = await api.get('/api/unified/account/acc-123');

// Create a deal
const { data } = await api.post('/api/b2b/deals', {
  name: 'Enterprise License',
  companyId: 'acc-123',
  value: 100000,
  expectedCloseDate: '2026-07-01'
});

// Track activity
await api.post('/api/b2b/activities', {
  type: 'meeting',
  entityType: 'deal',
  entityId: 'deal-123',
  title: 'Discovery call with Acme Corp'
});
```

## Service Integration Examples

### TAM Builder (4128)

```typescript
// Create ICP
const icp = await api.post('/api/b2b/icps', {
  name: 'Enterprise SaaS',
  firmographics: {
    industries: ['SaaS', 'Technology'],
    companySizes: ['mid-market', 'enterprise'],
    revenueRange: { min: 1000000, max: 100000000 }
  }
});

// Search companies
const companies = await api.get('/api/b2b/companies/search', {
  params: { q: 'enterprise', industry: 'SaaS' }
});

// Score account
const score = await api.post('/api/b2b/companies/acc-123/score');
```

### Signal Service (4129)

```typescript
// Get signals for company
const signals = await api.get('/api/b2b/signals', {
  params: { accountId: 'acc-123' }
});

// Get alerts
const alerts = await api.get('/api/b2b/alerts', {
  params: { severity: 'high' }
});

// Track intent
const trends = await api.get('/api/b2b/trends', {
  params: { period: '30d' }
});
```

### Deal Intelligence (4131)

```typescript
// Create deal
const deal = await api.post('/api/b2b/deals', {
  name: 'Enterprise License',
  companyId: 'acc-123',
  value: 120000,
  stage: 'qualification',
  expectedCloseDate: '2026-06-30'
});

// Get AI score
const score = await api.get(`/api/b2b/deals/${deal.id}/score`);

// Get recommendations
const recs = await api.get(`/api/b2b/deals/${deal.id}/recommendations`);
```

### Activity Service (4132)

```typescript
// Log activity
await api.post('/api/b2b/activities', {
  type: 'call',
  entityType: 'deal',
  entityId: 'deal-123',
  title: 'Discovery call',
  duration: 30,
  outcome: 'positive'
});

// Get timeline
const timeline = await api.get('/api/b2b/activities', {
  params: { dealId: 'deal-123' }
});
```

### Meeting Notes (4133)

```typescript
// Create note
const note = await api.post('/api/b2b/notes', {
  title: 'Q2 Review Meeting',
  meetingType: 'video',
  dealId: 'deal-123',
  attendees: [
    { email: 'john@acme.com', name: 'John Doe', isPrimary: true }
  ],
  notes: 'Discussed pricing and timeline...'
});

// Add action item
await api.post(`/api/b2b/notes/${note.id}/action-items`, {
  title: 'Send revised proposal',
  assignedTo: { email: 'sales@company.com', name: 'Sales Team' },
  dueDate: '2026-06-05',
  priority: 'high'
});
```

### Buyer Mapping (4134)

```typescript
// Create stakeholder map
const map = await api.post('/api/b2b/mapping/stakeholder-maps', {
  accountId: 'acc-123',
  accountName: 'Acme Corp'
});

// Add contacts
await api.post(`/api/b2b/mapping/stakeholder-maps/${map.id}/contacts`, {
  contactId: 'contact-123'
});

// Get coverage analysis
const matrix = await api.get(`/api/b2b/mapping/matrix/deal/${dealId}`);
```

### Personalization (4135)

```typescript
// Create template
const template = await api.post('/api/b2b/templates', {
  name: 'Enterprise Outreach',
  contentType: 'email',
  subject: 'Quick question about {{companyName}}',
  body: 'Hi {{firstName}},\n\nI noticed...',
  variables: [
    { name: 'firstName', source: 'contact' },
    { name: 'companyName', source: 'company' }
  ]
});

// Generate personalized content
const content = await api.post('/api/b2b/generate/generate', {
  templateId: template.id,
  contactId: 'contact-123',
  companyId: 'acc-123'
});
```

### Pipeline Suggestions (4137)

```typescript
// Get pipeline
const pipeline = await api.get('/api/b2b/pipelines');

// Generate forecast
const forecast = await api.post('/api/b2b/forecasts/generate', {
  pipelineId: pipeline.id,
  period: 'monthly'
});

// Get suggestions
const suggestions = await api.post('/api/b2b/suggestions/generate', {
  pipelineId: pipeline.id
});
```

## Unified Endpoints

The B2B Gateway provides unified endpoints that aggregate data across services:

### Account View
```typescript
// GET /api/unified/account/:id
const view = await api.get('/api/unified/account/acc-123');
// Returns: { account, signals, deals, activities, contacts, insights }
```

### Deal View
```typescript
// GET /api/unified/deal/:id
const view = await api.get('/api/unified/deal/deal-123');
// Returns: { deal, activities, notes, contacts, signals, score, recommendations }
```

### Pipeline Overview
```typescript
// GET /api/unified/pipeline
const overview = await api.get('/api/unified/pipeline');
// Returns: { pipeline, deals, forecasts, suggestions, analytics }
```

## Webhook Events

Subscribe to events for real-time updates:

```typescript
// Available webhook events:
// - company.created, company.updated
// - deal.created, deal.stage_changed, deal.closed
// - signal.detected, signal.high_intent
// - activity.created
// - meeting.completed

// Webhook payload:
{
  "event": "deal.stage_changed",
  "timestamp": "2026-06-02T12:00:00Z",
  "data": {
    "dealId": "deal-123",
    "oldStage": "proposal",
    "newStage": "negotiation",
    "probability": 75
  }
}
```

## Error Handling

```typescript
try {
  const response = await api.post('/api/b2b/deals', dealData);
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error(error.response.data.error);
    console.error(error.response.status);
  } else if (error.request) {
    // Request made but no response
    console.error('Service unavailable');
  } else {
    // Request setup error
    console.error(error.message);
  }
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Gateway | 1000 req/min |
| Per Service | 100 req/min |

## Health Monitoring

```typescript
// Check overall health
const health = await api.get('/health');
// { status: 'healthy', services: [...] }

// Check specific service
const serviceHealth = await api.get('/health/tamBuilder');
// { service: 'TAM Builder', status: 'up', latency: 45 }
```

## Data Flow Examples

### New Account → Active Deal

```
1. Create account (TAM Builder)
   POST /api/b2b/companies
   
2. Enrich company data
   POST /api/b2b/companies/:id/enrich
   
3. Discover contacts
   POST /api/b2b/contacts/discover
   
4. Track signals
   GET /api/b2b/signals?accountId=:id
   
5. Create deal
   POST /api/b2b/deals
   
6. Log activities
   POST /api/b2b/activities
   
7. Create meeting notes
   POST /api/b2b/notes
   
8. Generate outreach
   POST /api/b2b/generate/generate
   
9. Track engagement
   GET /api/unified/account/:id
```

### Deal → Close

```
1. Get deal with full context
   GET /api/unified/deal/:dealId
   
2. Get AI score & recommendations
   GET /api/b2b/deals/:id/score
   
3. Update deal stage
   PATCH /api/b2b/deals/:id
   
4. Log activity
   POST /api/b2b/activities
   
5. Generate follow-up content
   POST /api/b2b/generate/generate
   
6. Update buyer matrix
   POST /api/b2b/mapping/matrix/generate
   
7. Close deal
   PATCH /api/b2b/deals/:id (stage: closed_won)
   
8. Pipeline updates automatically
   GET /api/b2b/forecasts/latest
```

## Testing

```typescript
// Mock responses for testing
const mockAccountView = {
  account: { id: 'acc-123', name: 'Acme Corp' },
  signals: [{ type: 'funding', intentScore: 85 }],
  deals: [{ id: 'deal-1', value: 100000 }],
  activities: [],
  contacts: [],
  insights: {
    intentLevel: 'high',
    engagementScore: 75,
    riskLevel: 'low',
    recommendations: ['Prioritize outreach']
  }
};
```

## Support

- **Documentation:** See individual service README files
- **Types:** Import from `@rez/b2b-types`
- **Gateway:** http://localhost:4138
- **Dashboard:** http://localhost:4139

## Appendix: Environment Variables

```bash
# Gateway
PORT=4138
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=*

# Service URLs (defaults)
TAM_BUILDER_URL=http://localhost:4128
SIGNAL_SERVICE_URL=http://localhost:4129
OUTBOUND_SERVICE_URL=http://localhost:4130
DEAL_INTELLIGENCE_URL=http://localhost:4131
ACTIVITY_SERVICE_URL=http://localhost:4132
MEETING_NOTES_URL=http://localhost:4133
BUYER_MAPPING_URL=http://localhost:4134
PERSONALIZATION_URL=http://localhost:4135
AI_CRM_UPDATES_URL=http://localhost:4136
PIPELINE_SUGGESTIONS_URL=http://localhost:4137
```

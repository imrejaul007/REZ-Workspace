# REZ AI CRM Updates Service

**Port:** 4136  
**Status:** Complete

## Overview

AI-powered CRM auto-updates and data enrichment service. Automatically updates CRM fields, calculates health scores, analyzes sentiment, and recommends next actions based on activity patterns.

## Features

- **Field Enrichment** - Automatically populate CRM fields from enrichment sources
- **Health Score** - Calculate deal/contact health based on engagement signals
- **Sentiment Analysis** - Track sentiment across interactions
- **Next Action** - AI-recommended next best actions
- **Scheduled Updates** - Configure rules to run on cron schedules
- **Event Triggers** - Update on specific CRM events
- **Batch Processing** - Process multiple entities at once

## Update Types

| Type | Description |
|------|-------------|
| field_enrichment | Populate empty fields from enrichment data |
| contact_update | Update contact fields |
| company_update | Update company/account fields |
| deal_update | Update deal/opp fields |
| activity_log | Log AI-generated activity summaries |
| sentiment_analysis | Analyze sentiment from interactions |
| intent_detection | Detect buying intent signals |
| health_score | Calculate engagement health score |
| next_action | Recommend next best action |

## Data Model

### AutoUpdateRule

```typescript
interface AutoUpdateRule {
  _id: ObjectId;
  tenantId: string;
  
  name: string;
  trigger: {
    type: 'scheduled' | 'event' | 'manual';
    schedule?: string; // Cron
    eventType?: string;
    entityType?: 'contact' | 'company' | 'deal';
  };
  
  updateType: UpdateType;
  targetEntity: 'contact' | 'company' | 'deal';
  
  fieldMappings: {
    sourceField: string;
    targetField: string;
    transform?: 'uppercase' | 'lowercase' | 'titlecase';
  }[];
  
  aiConfig?: {
    model: 'openai' | 'anthropic' | 'internal' | 'rule_based';
    prompt?: string;
  };
  
  isActive: boolean;
  stats: { runCount, successCount, failureCount };
}
```

### UpdateJob

```typescript
interface UpdateJob {
  _id: ObjectId;
  ruleId?: ObjectId;
  updateType: UpdateType;
  targetEntity: string;
  targetId: string;
  
  updates: [{
    field: string;
    oldValue?: any;
    newValue?: any;
    source: 'ai' | 'enrichment' | 'rule' | 'manual';
    confidence?: number;
  }];
  
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
```

### HealthScore

```typescript
interface HealthScore {
  score: number; // 0-100
  components: [{
    name: string;
    score: number;
    weight: number;
    reason: string;
  }];
  
  positiveFactors: string[];
  negativeFactors: string[];
  riskFactors: string[];
  
  period: 'daily' | 'weekly' | 'monthly';
}
```

## API Endpoints

### Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rules` | Create rule |
| GET | `/api/v1/rules` | List rules |
| GET | `/api/v1/rules/:id` | Get rule |
| PATCH | `/api/v1/rules/:id` | Update rule |
| DELETE | `/api/v1/rules/:id` | Delete rule |
| PATCH | `/api/v1/rules/:id/toggle` | Toggle active |
| POST | `/api/v1/rules/:id/run` | Run for entity |
| POST | `/api/v1/rules/:id/run-batch` | Run for batch |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/jobs/run` | Run manual update |
| GET | `/api/v1/jobs` | List jobs |
| GET | `/api/v1/jobs/:id` | Get job |
| GET | `/api/v1/jobs/entity/:type/:id` | Get entity jobs |
| GET | `/api/v1/jobs/health-score/:type/:id` | Get health score |
| GET | `/api/v1/jobs/activity-summary/:type/:id` | Get summary |
| GET | `/api/v1/jobs/stats/overview` | Get stats |

## Health Score Calculation

```
Health Score = Σ(component_score × weight)

Components:
- Activity Frequency (40%): Based on touchpoints
- Engagement Quality (30%): Based on interaction type
- Recency (30%): Based on last contact date
```

| Score | Status | Action |
|-------|--------|--------|
| 80-100 | Healthy | Accelerate |
| 60-79 | Good | Maintain |
| 40-59 | At Risk | Nurture |
| 0-39 | Critical | Re-engage |

## Installation

```bash
cd REZ-ai-crm-updates
npm install
npm run dev
```

## Cron Schedule Examples

```javascript
'0 9 * * *'        // Daily at 9 AM
'0 */6 * * *'      // Every 6 hours
'0 9 * * 1-5'      // Weekdays at 9 AM
'0 0 1 * *'        // First of month
```

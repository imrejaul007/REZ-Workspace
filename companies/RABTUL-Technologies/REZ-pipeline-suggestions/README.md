# REZ Pipeline Suggestions Service

**Port:** 4137  
**Status:** Complete

## Overview

AI-powered pipeline management, forecasting, and deal suggestions. Manages pipeline stages, generates revenue forecasts, and provides intelligent deal recommendations.

## Features

- **Pipeline Management** - Create and manage sales pipelines with custom stages
- **Revenue Forecasting** - AI-powered weighted pipeline forecasting
- **Deal Suggestions** - Intelligent suggestions for deal actions
- **Stage Analysis** - Track stage velocity and conversion rates
- **Risk Alerts** - Identify at-risk deals and pipeline gaps

## Pipeline Structure

```
Pipeline
├── Stage 1 (Lead) - 10%
├── Stage 2 (Qualified) - 25%
├── Stage 3 (Demo) - 50%
├── Stage 4 (Proposal) - 75%
├── Won - 100%
└── Lost - 0%
```

## Data Model

### Pipeline

```typescript
interface Pipeline {
  _id: ObjectId;
  tenantId: string;
  
  name: string;
  stages: PipelineStage[];
  
  defaultCurrency: string;
  isDefault: boolean;
}

interface PipelineStage {
  name: string;
  order: number;
  probability: number; // 0-100
  avgDaysInStage: number;
  
  isWonStage: boolean;
  isLostStage: boolean;
  
  dealCount: number;
  totalValue: number;
}
```

### Forecast

```typescript
interface Forecast {
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  
  startDate: Date;
  endDate: Date;
  
  totalPipeline: number;
  weightedPipeline: number;
  
  stageBreakdown: [{
    stageId: ObjectId;
    dealCount: number;
    totalValue: number;
    weightedValue: number;
  }];
  
  confidence: number; // 0-100
}
```

### Suggestion

```typescript
interface Suggestion {
  type: 'stall_warning' | 'risk_alert' | 'opportunity' | 'accelerate';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  dealId?: string;
  title: string;
  description: string;
  reason: string;
  
  action: string;
  potentialValue?: number;
  
  status: 'pending' | 'accepted' | 'dismissed' | 'completed';
}
```

## API Endpoints

### Pipelines

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/pipelines` | Create pipeline |
| GET | `/api/v1/pipelines` | List pipelines |
| GET | `/api/v1/pipelines/:id` | Get pipeline |
| PATCH | `/api/v1/pipelines/:id` | Update pipeline |
| DELETE | `/api/v1/pipelines/:id` | Delete pipeline |
| POST | `/api/v1/pipelines/:id/stages` | Add stage |
| PATCH | `/api/v1/pipelines/:id/stages/:sid` | Update stage |
| DELETE | `/api/v1/pipelines/:id/stages/:sid` | Delete stage |
| POST | `/api/v1/pipelines/:id/stages/reorder` | Reorder stages |

### Forecasts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/forecasts/generate` | Generate forecast |
| GET | `/api/v1/forecasts` | List forecasts |
| GET | `/api/v1/forecasts/latest` | Get latest forecast |
| GET | `/api/v1/forecasts/:id` | Get forecast |
| GET | `/api/v1/forecasts/compare` | Compare periods |
| DELETE | `/api/v1/forecasts/:id` | Delete forecast |

### Suggestions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/suggestions/generate` | Generate suggestions |
| GET | `/api/v1/suggestions` | List suggestions |
| GET | `/api/v1/suggestions/:id` | Get suggestion |
| PATCH | `/api/v1/suggestions/:id/accept` | Accept suggestion |
| PATCH | `/api/v1/suggestions/:id/dismiss` | Dismiss suggestion |
| PATCH | `/api/v1/suggestions/:id/complete` | Mark complete |
| GET | `/api/v1/suggestions/deal/:id` | Get deal suggestions |
| GET | `/api/v1/suggestions/stats/pending` | Get pending count |
| POST | `/api/v1/suggestions/signals` | Record deal signal |

## Suggestion Types

| Type | Description |
|------|-------------|
| stall_warning | Deals stuck in stage too long |
| risk_alert | High-value deals at risk |
| opportunity | Pipeline gaps or opportunities |
| increase_effort | Deals needing more attention |
| accelerate | Deals ready to close |
| move_stage | Stage change recommendations |

## Forecast Calculation

```
Weighted Pipeline = Σ(stage_value × stage_probability)

Confidence Factors:
+ Well-defined stages (>5 stages)
+ Sufficient volume (>100K)
+ Historical accuracy
- Missing stage data
- High volatility
```

## Installation

```bash
cd REZ-pipeline-suggestions
npm install
npm run dev
```

## Integration Points

- Deal Intelligence (4131) - Deal data
- Signal Service (4129) - Activity signals
- Buyer Mapping (4134) - Stakeholder analysis

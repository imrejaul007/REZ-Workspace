# @rez/b2b-types

Shared TypeScript types for REZ B2B Revenue OS.

## Installation

```bash
npm install @rez/b2b-types
```

## Usage

```typescript
import { Company, Deal, Signal, Activity, AccountView } from '@rez/b2b-types';

// Use with TAM Builder
const company: Company = {
  id: '123',
  tenantId: 'tenant-1',
  name: 'Acme Corp',
  domain: 'acme.com',
  industry: 'SaaS',
  companySize: 'enterprise',
  // ...
};

// Use with Deal Intelligence
const deal: Deal = {
  id: 'deal-1',
  tenantId: 'tenant-1',
  companyId: '123',
  name: 'Enterprise License',
  value: 100000,
  stage: 'proposal',
  // ...
};
```

## Type Categories

| Category | Types |
|----------|-------|
| **Common** | Tenant, User, Pagination, ApiResponse |
| **TAM Builder** | ICP, Company, Contact, DecisionRole |
| **Signals** | Signal, Alert, SignalType, IntentStage |
| **Outbound** | Sequence, SequenceStep, Prospect, ChannelType |
| **Deal Intelligence** | Deal, DealRisk, DealRecommendation, WinLikelihood |
| **Activity** | Activity, ActivityType |
| **Meeting Notes** | MeetingNote, ActionItem, MeetingAttendee |
| **Buyer Mapping** | BuyerPersona, StakeholderMap, BuyerGap |
| **Personalization** | ContentTemplate, TemplateVariable |
| **AI CRM** | HealthScore, AutoUpdateRule, UpdateType |
| **Pipeline** | Pipeline, PipelineStage, Forecast, PipelineSuggestion |
| **Unified** | AccountView, DealView, PipelineOverview |

## Building

```bash
npm run build
```

## Published Packages

This package is designed to be published to npm for use across all B2B services.

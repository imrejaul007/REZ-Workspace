# BOA OS Developer Guide

## Architecture

BOA OS is a multi-executive intelligence platform that simulates a C-suite advisory board:

```
┌─────────────────────────────────────────────────────────────┐
│                      BOA Coordinator                         │
│  Synthesizes recommendations from all executives            │
└─────────────────────────────────────────────────────────────┘
         │           │           │           │           │           │
    ┌────┴────┐ ┌──┴───┐ ┌──┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴────┐
    │   CEO   │ │  CFO  │ │  COO  │ │  CMO  │ │ CHRO  │ │  CRO   │
    │ Strategy│ │Finance│ │ Ops   │ │Marketing│ │People │ │Revenue │
    └─────────┘ └──────┘ └──────┘ └───────┘ └───────┘ └────────┘
```

## Adding New Executives

To add a new executive engine:

1. Create a new class extending `ExecutiveEngine`
2. Implement `generateInsights()` and `generateRecommendations()`
3. Add to `BOACoordinator` constructor

```javascript
class CXOEngine extends ExecutiveEngine {
  constructor() {
    super('cxo', 'Domain focus');
  }

  generateInsights(data) {
    return [{ insight: '...', confidence: 0.85 }];
  }

  generateRecommendations(data) {
    return [{ action: '...', impact: 'high' }];
  }
}
```

## Session Management

Sessions track company context across analysis requests:

```javascript
POST /api/sessions
{
  "companyId": "company_123",
  "context": { "industry": "retail", "size": "enterprise" }
}
```

## Analysis Flow

1. Client creates session
2. Sends data to `/api/analyze`
3. All 6 executives analyze in parallel
4. Coordinator synthesizes recommendations
5. Client retrieves insights

## Metrics

- `activeSessions`: Number of active analysis sessions
- `totalInsights`: Total analyses stored
- `executives`: Per-executive status and capabilities

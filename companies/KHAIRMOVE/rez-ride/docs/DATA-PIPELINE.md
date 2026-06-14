# ReZ Intelligence - Continuous Data Flow

## Overview

ReZ Intelligence receives **continuous real-time data** from ReZ Ride to power ML models and generate insights.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ReZ Ride                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ User App   │  │ Driver App  │  │ Backend API │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                 │                 │                   │
│         └────────────────┼─────────────────┘                   │
│                          │                                     │
│                          ▼                                     │
│              ┌───────────────────────┐                       │
│              │  Data Pipeline Service │  ←─ Batches every 5s │
│              └───────────┬───────────┘                       │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ReZ Intelligence                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Intent      │  │ Churn       │  │ LTV          │         │
│  │ Predictor   │  │ Engine      │  │ Calculator   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────┐        │
│  │              Signal Aggregator                    │        │
│  └─────────────────────────────────────────────────┘        │
│                              │                                 │
│                              ▼                                 │
│  ┌─────────────────────────────────────────────────┐        │
│  │              Unified Profile                      │        │
│  │  • Segments • Preferences • Behavior • LTV      │        │
│  └─────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

## Real-Time Events

### User Events
| Event | Frequency | ML Impact |
|-------|-----------|-----------|
| Search | High | Destination prediction |
| Book | High | Conversion signal |
| Complete | High | LTV update |
| Cancel | Medium | Churn signal |
| Rate | Medium | Quality signal |

### Driver Events
| Event | Frequency | ML Impact |
|-------|-----------|-----------|
| Accept | High | Supply signal |
| Reject | Medium | Demand/supply ratio |
| Start | High | Active time |
| Complete | High | Earnings update |
| Cancel | Low | Quality signal |

## Data Pipeline

### Event Batching
- Events collected in queue
- Flushed every **5 seconds**
- Batch size: **50 events max**
- Auto-flush on batch full

### Real-Time Processing
```
User searches destination
    ↓
Event queued (immediate)
    ↓
Batch flushed to ReZ Intelligence (5s)
    ↓
ML model updates predictions
    ↓
User gets better recommendations (next search)
```

## ML Models Updated

### 1. Intent Prediction
- **Input**: Search history, location, time
- **Output**: Next destination probability
- **Update**: Every 5 seconds

### 2. Churn Detection
- **Input**: Days since ride, frequency, rating
- **Output**: Churn risk score (0-100)
- **Update**: On each ride completion

### 3. LTV Attribution
- **Input**: Total rides, spend, frequency
- **Output**: Lifetime value prediction
- **Update**: On each transaction

### 4. Surge Prediction
- **Input**: Location, time, demand signals
- **Output**: Surge multiplier
- **Update**: Every 15 minutes

### 5. Driver Matching
- **Input**: Distance, rating, acceptance rate
- **Output**: Match score
- **Update**: On each event

## API Endpoints

### Send Event
```
POST /api/intel/event
{
  "type": "search",
  "userId": "user_123",
  "data": { ... },
  "timestamp": "2026-05-19T10:00:00Z"
}
```

### Get User Insights
```
GET /api/intel/user/:userId/insights
{
  "segment": "active",
  "churnRisk": "low",
  "ltv": 25000,
  "recommendations": [...]
}
```

### Get Predictions
```
GET /api/intel/predict/:userId
{
  "nextDestination": "MG Road",
  "preferredVehicle": "cab",
  "optimalTime": "18:00"
}
```

## Benefits

| Benefit | Impact |
|---------|--------|
| Better predictions | 15% accuracy improvement |
| Faster churn detection | 24h → 1h |
| Personalized experience | +20% engagement |
| Dynamic pricing | +10% revenue |
| Driver matching | +25% acceptance |

## Monitoring

Track data flow in logs:
```bash
# View pipeline logs
grep "Data pipeline" logs/app.log

# Check flush stats
grep "Flushed" logs/app.log
```

## Fallback

If ReZ Intelligence is unavailable:
- Events queued locally
- Retry on reconnect
- No user-facing impact

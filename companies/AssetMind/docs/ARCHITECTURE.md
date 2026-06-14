# AssetMind Architecture

**Version:** 1.0  
**Date:** June 5, 2026  
**Reference:** See `AssetMind_Architecture_v1.0.md` for complete technical architecture

---

## Overview

AssetMind is a Financial Intelligence Infrastructure platform built on a 20-layer architecture. This document provides a high-level overview with references to detailed documentation.

## Architecture Principles

1. **Modularity** - Each service has a single responsibility
2. **Scalability** - Horizontal scaling for all user-facing services
3. **Resilience** - No single point of failure
4. **Observability** - Full logging, metrics, and tracing
5. **Security** - Zero-trust security model

---

## 20-Layer Architecture

```
AssetMind Platform
├── Layer 1:  Asset Universe
├── Layer 2:  Twin Engine
├── Layer 3:  Data Layer
├── Layer 4:  Financial Memory
├── Layer 5:  Knowledge Graph
├── Layer 6:  Intelligence Engines
├── Layer 7:  Scoring Engines
├── Layer 8:  AI Agent Layer
├── Layer 9:  Decision Layer
├── Layer 10: Prediction Layer
├── Layer 11: Learning Layer
├── Layer 12: Daily Intelligence
├── Layer 13: Discovery Layer
├── Layer 14: Research Layer
├── Layer 15: Simulation Layer
├── Layer 16: Trader Layer
├── Layer 17: Enterprise Layer
├── Layer 18: Marketplace Layer
├── Layer 19: API Platform
└── Layer 20: Execution Layer
    + Capital Allocation Engine
```

---

## Core Tiers

### Core Tier (Ports 5001-5006)

| Service | Port | Description |
|---------|------|-------------|
| Asset Universe | 5001 | Master asset database |
| Asset Twin | 5002 | Per-asset digital twin |
| Market Twin | 5003 | Market-wide digital twin |
| Portfolio Twin | 5004 | User portfolio digital twin |
| Investor Twin | 5005 | User behavior twin |
| Intelligence Twin | 5006 | AI prediction twin |

### Data Tier (Ports 5010-5042)

| Service | Port | Description |
|---------|------|-------------|
| Market Data | 5010 | Real-time prices |
| Financial Data | 5011 | SEC filings, financials |
| Earnings | 5012 | Earnings transcripts |
| News | 5013 | Financial news |
| Social Sentiment | 5014 | Social media sentiment |
| Macro Data | 5015 | Economic indicators |
| Knowledge Graph | 5040 | Relationship database |

### Intelligence Tier (Ports 5050-5060)

| Service | Port | Description |
|---------|------|-------------|
| Financial Intelligence | 5050 | DCF, ratios |
| Risk Intelligence | 5053 | Risk assessment |
| Sentiment Intelligence | 5052 | Sentiment analysis |
| Macro Intelligence | 5057 | Macro analysis |

### Agent Tier (Ports 5090-5112)

| Service | Port | Description |
|---------|------|-------------|
| Agent Orchestrator | 5090 | Routes queries |
| Asset Agent | 5100 | Asset analysis |
| Research Agent | 5109 | Report generation |
| Discovery Agent | 5111 | Opportunity finding |

### Gateway Tier (Ports 5260-5266)

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 5260 | REST API entry |
| WebSocket Gateway | 5261 | Real-time updates |
| Auth Service | 5263 | Authentication |
| Payment Service | 5264 | Payments |

---

## Database Architecture

### Multi-Database Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ PostgreSQL   │     │  TimescaleDB  │     │    Neo4j      │
│    (5432)     │     │    (5433)     │     │    (7687)     │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ Business Logic│     │  Time-Series  │     │  Knowledge │
│  Relational  │     │    Analytics  │     │    Graph      │
│ Tables │     │   Hypertables │     │ Relationships │
└───────────────┘     └───────────────┘     └───────────────┘
```

### PostgreSQL Tables (15+)

- `assets` - Asset universe
- `asset_twins` - Digital twin data
- `users` - User accounts
- `portfolios` - Holdings
- `predictions` - AI predictions
- `scores` - Asset scores
- `intelligence_reports` - Research reports
- `briefings` - Daily briefings
- `news_articles` - Financial news
- `earnings_data` - Earnings data
- `filings` - SEC filings
- `user_queries` - Query history
- `api_usage` - Usage tracking
- `subscriptions` - User subscriptions
- `watchlists` - User watchlists

### TimescaleDB Hypertables

- `price_history` - OHLCV data
- `score_history` - Score history
- `sentiment_history` - Sentiment data
- `prediction_history` - Prediction history
- `market_metrics` - Market indicators
- `user_activity` - User behavior
- `api_usage` - API requests

### Neo4j Graph

- **Node Types:** Company, Person, Sector, Country, Theme, Event
- **Relationships:** SUPPLIES_TO, COMPETES_WITH, LEADS_THEME, etc.

---

## Service Communication

### Synchronous (REST)

```bash
# Client → API Gateway → Service
curl http://localhost:5260/api/v1/assets/AAPL
```

### Asynchronous (Events)

```bash
# Services communicate via Redis pub/sub
# Event: asset.updated
# Publisher: asset-universe
# Subscribers: twin-engine, intelligence
```

### Real-time (WebSocket)

```javascript
// Client → WebSocket Gateway → Real-time updates
socket.emit('subscribe', { channel: 'price:AAPL' });
socket.on('price:AAPL', (data) => { ... });
```

---

## Security Architecture

### Authentication Flow

```
User → Frontend → API Gateway → Auth Service → RABTUL Auth
                          ↓
                    API Key Validation
                          ↓
                    Rate Limiting
 ↓
                    Service Layer
```

### Security Layers

1. **Network** - VPC, security groups, WAF
2. **Transport** - TLS 1.3, mTLS between services
3. **Application** - API keys, JWT, OAuth 2.0
4. **Data** - Encryption at rest, field-level encryption

---

## Scalability

### Horizontal Scaling

| Service | Scaling Strategy |
|---------|-----------------|
| API Gateway | 5+ replicas |
| Agent Orchestrator | 4+ replicas |
| Asset Universe | 3+ replicas |
| WebSocket Gateway | 3+ replicas |
| Intelligence Engines | 2+ replicas |

### Auto-scaling Configuration

```yaml
# Kubernetes HPA
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Observability

### Logging

- **Format:** JSON structured logs
- **Aggregation:** Loki, CloudWatch
- **Retention:** 30 days hot, 90 days cold

### Metrics

- **Collection:** Prometheus
- **Visualization:** Grafana
- **Alerting:** PagerDuty, Slack

### Tracing

- **Distributed Tracing:** Jaeger
- **Correlation IDs:** Request tracking
- **Span Attributes:** Service, endpoint, user

---

## Deployment Architecture

### Development

```
┌─────────────────────────────────────┐
│ Docker Compose              │
├─────────────────────────────────────┤
│ PostgreSQL │ TimescaleDB │ Neo4j │
│   Redis   │   Gateway │ Frontend  │
│  Services │ │           │
└─────────────────────────────────────┘
```

### Production

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                             │
│                    (CloudFlare) │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
├─────────────────────────────────────────────────────────────┤
│ Frontend    │  API Gateway  │  WebSocket   │  Services      │
│ (3 pods)    │   (5 pods)    │  (3 pods)    │  (2-5 pods)   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Managed Services                         │
├─────────────────────────────────────────────────────────────┤
│ RDS PostgreSQL │ RDS TimescaleDB │ Neo4j Aura │ ElastiCache  │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Port Registry

See `AssetMind_Architecture_v1.0.md` for the complete port registry (700+ ports).

---

## Related Documentation

| Document | Description |
|----------|-------------|
| `AssetMind_Architecture_v1.0.md` | Complete technical architecture |
| `API_SPECIFICATION.md` | API endpoint documentation |
| `QUICK_START.md` | Installation and setup guide |
| `DEPLOYMENT.md` | Production deployment guide |
| `SERVICE_INDEX.md` | All services index |

---

## Architecture Decisions

### Why Multi-Database?

1. **PostgreSQL** - ACID compliance for business logic
2. **TimescaleDB** - Optimized time-series queries
3. **Neo4j** - Complex relationship traversal

### Why Microservices?

1. **Independent Scaling** - Scale hot paths
2. **Fault Isolation** - Failure containment
3. **Technology Flexibility** - Best tool per job
4. **Team Autonomy** - Service ownership

### Why 20 Layers?

Each layer builds on the previous:
1. Asset Universe → Twin Engine (identity)
2. Twin Engine → Data Layer (data foundation)
3. Data Layer → Memory (data persistence)
4. Memory → Knowledge Graph (relationships)
5. Knowledge Graph → Intelligence (understanding)
6. Intelligence → Scores (quantification)
7. Scores → Agents (automation)
8. Agents → Decisions (action)
9. Decisions → Predictions (future)
10. Predictions → Learning (improvement)

---

## Support

- Architecture Questions: architecture@assetmind.ai
- GitHub Issues: https://github.com/assetmind/assetmind/issues
# AssetMind - Financial Intelligence Platform

**Version:** 1.0.0  
**Last Updated:** June 12, 2026

---

## 🎯 Quick Links

| Resource | Description |
|----------|-------------|
| [PRODUCTION-READY.md](PRODUCTION-READY.md) | Production deployment summary |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Complete deployment guide |
| [MONITORING.md](MONITORING.md) | Prometheus/Grafana setup |
| [SECURITY.md](SECURITY.md) | Security hardening |
| [MOBILE-STORE.md](MOBILE-STORE.md) | App store submission |
| [AUDIT-REPORT.md](AUDIT-REPORT.md) | Detailed audit report |

---

## 📚 Documentation

### Getting Started
1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Services](#services)
4. [API Reference](#api-reference)

### Deployment
- [Docker Deployment](DEPLOYMENT.md#docker-compose)
- [Kubernetes Deployment](DEPLOYMENT.md#kubernetes)
- [Environment Configuration](DEPLOYMENT.md#environment-configuration)

### Operations
- [Monitoring Setup](MONITORING.md)
- [Security Hardening](SECURITY.md)
- [Troubleshooting](DEPLOYMENT.md#troubleshooting)

### Mobile
- [App Store Submission](MOBILE-STORE.md)
- [iOS Build](MOBILE-STORE.md#step-3-build-for-ios)
- [Android Build](MOBILE-STORE.md#step-4-build-for-android)

---

## 🚀 Quick Start

### Docker Compose

```bash
# Clone and start
git clone https://github.com/assetmind/assetmind.git
cd assetmind/codebase

# Copy environment
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d

# Check health
curl http://localhost:5260/health
```

### Local Development

```bash
# Python services
cd assetmind-twin-engine
pip install -r requirements.txt
uvicorn src:app --port 5002

# TypeScript services
cd assetmind-api-gateway
npm install
npm run dev
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ASSETMIND ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                           CLIENTS                                      │ │
│  │   Mobile App │ Web Dashboard │ Partner APIs │ Trading Systems        │ │
│  └────────────────────────────────┬───────────────────────────────────────┘ │
│                                   │                                         │
│                                   ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                        API GATEWAY (5260)                             │ │
│  │    Authentication │ Rate Limiting │ Request Routing │ Load Balance   │ │
│  └────────────────────────────────┬───────────────────────────────────────┘ │
│                                   │                                         │
│  ┌───────────────┬───────────────┼───────────────┬───────────────────────┐ │
│  │               │               │               │                       │ │
│  ▼               ▼               ▼               ▼                       ▼ │
│ ┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────┐ │
│ │   DATA  │ │  TWIN   │ │ INTELLIGENCE│ │  AGENTS │ │    OTHER     │ │
│ │  TIER   │ │  ENGINE │ │    TIER     │ │   TIER  │ │   SERVICES   │ │
│ │(5010+)  │ │(5002+)  │ │  (5050+)    │ │ (5090+) │ │              │ │
│ └─────────┘ └─────────┘ └─────────────┘ └──────────┘ └──────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                        DATA STORES                                     │ │
│  │   PostgreSQL │ Redis │ Neo4j │ TimescaleDB │ S3                     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                     EXTERNAL INTEGRATIONS                               │ │
│  │         HOJAI AI │ RABTUL │ Market Data Providers │ Exchanges       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Services

### Core Tier (5001-5006)

| Service | Port | Description | README |
|---------|------|-------------|--------|
| assetmind-asset-universe | 5001 | Asset data management | [📄](assetmind-asset-universe/README.md) |
| assetmind-twin-engine | 5002 | Digital twin engine | [📄](assetmind-twin-engine/README.md) |
| assetmind-market-twin | 5003 | Market digital twin | [📄](assetmind-market-twin/README.md) |
| assetmind-portfolio-twin | 5004 | Portfolio twin | [📄](assetmind-portfolio-twin/README.md) |
| assetmind-investor-twin | 5005 | Investor twin | [📄](assetmind-investor-twin/README.md) |
| assetmind-intelligence-twin | 5006 | AI intelligence twin | [📄](assetmind-intelligence-twin/README.md) |

### Data Tier (5010-5023)

| Service | Port | Description | README |
|---------|------|-------------|--------|
| assetmind-data | 5010 | Market data aggregation | [📄](assetmind-data/README.md) |
| assetmind-news | 5012 | News service | [📄](assetmind-news/README.md) |
| assetmind-social | 5013 | Social data | [📄](assetmind-social/README.md) |
| assetmind-macro | 5014 | Macro economic data | [📄](assetmind-macro/README.md) |
| assetmind-crypto | 5018 | Cryptocurrency data | [📄](assetmind-crypto/README.md) |

### Intelligence Tier (5050-5060)

| Service | Port | Description | README |
|---------|------|-------------|--------|
| assetmind-intelligence | 5050 | Financial intelligence | [📄](assetmind-intelligence/README.md) |
| assetmind-sentiment | 5052 | Sentiment analysis | [📄](assetmind-sentiment/README.md) |
| assetmind-risk | 5053 | Risk intelligence | [📄](assetmind-risk/README.md) |

### Agent Tier (5090-5112)

| Service | Port | Description | README |
|---------|------|-------------|--------|
| assetmind-agents | 5090 | Agent orchestrator | [📄](assetmind-agents/README.md) |
| assetmind-portfolio-optimizer | 5091 | Portfolio optimization | [📄](assetmind-portfolio-optimizer/README.md) |
| assetmind-risk-manager | 5092 | Risk management | [📄](assetmind-risk-manager/README.md) |

### Gateway & Infrastructure

| Service | Port | Description | README |
|---------|------|-------------|--------|
| assetmind-api-gateway | 5260 | Central gateway | [📄](assetmind-api-gateway/README.md) |
| assetmind-frontend | 3000 | Web dashboard | [📄](assetmind-frontend/README.md) |
| assetmind-mobile | 5005 | Mobile backend | [📄](assetmind-mobile/README.md) |
| assetmind-memory | 5030 | HOJAI memory | [📄](assetmind-memory/README.md) |

### All Services (83 total)

```
AI & Intelligence (12)
├── assetmind-intelligence
├── assetmind-intelligence-hub
├── assetmind-kronos
├── assetmind-reasoning
├── assetmind-council
├── assetmind-rl-trading
├── assetmind-event-intelligence
├── assetmind-event-os
├── assetmind-copilot
├── assetmind-rexmind
├── assetmind-rexmind-model
└── assetmind-memo-writer

Digital Twins (12)
├── assetmind-twin-engine
├── assetmind-twin-v2
├── assetmind-twin-hub
├── assetmind-portfolio-twin
├── assetmind-investor-twin
├── assetmind-market-twin
├── assetmind-asset-twin
├── assetmind-analyst-twin
├── assetmind-competitor-twin
├── assetmind-decision-twin
├── assetmind-economic-twin
└── assetmind-financial-memory

Trading & Finance (10)
├── assetmind-trading-engine
├── assetmind-trader
├── assetmind-broker-api
├── assetmind-paper-trading
├── assetmind-backtest
├── assetmind-scenario-engine
├── assetmind-capital-flow
├── assetmind-portfolio-analytics
├── assetmind-scoring
└── assetmind-predictions

Data & Connectors (8)
├── assetmind-data
├── assetmind-connectors
├── assetmind-yfinance
├── assetmind-sec
├── assetmind-news
├── assetmind-knowledge-graph
├── assetmind-ontology
└── assetmind-semantic-search

Agents & Orchestration (6)
├── assetmind-agents
├── assetmind-multiagent
├── assetmind-workflow
├── assetmind-discovery
├── assetmind-research
└── assetmind-execution

Frontend & Mobile (6)
├── assetmind-frontend
├── assetmind-mobile
├── assetmind-dashboard
├── assetmind-landing
├── assetmind-marketplace
└── assetmind-swagger

Infrastructure (19)
├── assetmind-api-gateway
├── assetmind-gateway
├── assetmind-core
├── assetmind-memory
├── assetmind-hojai-integration
├── assetmind-integrations
├── assetmind-db
├── assetmind-production
├── assetmind-security
├── assetmind-admin
├── assetmind-enterprise
├── assetmind-cicd
├── assetmind-tests
├── assetmind-sdk
├── assetmind-realtime
├── assetmind-daily
├── assetmind-briefing
├── assetmind-deal-room
├── assetmind-diligence
└── k8s/

Specialized (10)
├── assetmind-report-generator
├── assetmind-excel-engine
├── assetmind-covenant
├── assetmind-underwriting
├── assetmind-simulation
├── assetmind-reaction-engine
├── assetmind-market-intelligence
├── assetmind-asset-universe
├── assetmind-decisions
└── assetmind-voice-bridge
```

---

## 🌐 API Reference

### Base URL

```
Production: https://api.assetmind.ai
Staging:    https://staging-api.assetmind.ai
Local:      http://localhost:5260
```

### Authentication

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.assetmind.ai/v1/portfolio
```

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/assets` | GET | List assets |
| `/api/assets/{symbol}` | GET | Get asset details |
| `/api/twin/{symbol}` | GET | Get asset twin |
| `/api/portfolio` | GET | List portfolios |
| `/api/portfolio/{id}` | GET | Get portfolio details |
| `/api/intelligence` | GET | Get AI intelligence |

### Full API Documentation

- Swagger UI: `http://localhost:5260/docs`
- OpenAPI: `http://localhost:5260/openapi.json`

---

## 🔧 Configuration

### Required Environment Variables

```bash
# Security
ASSETMIND_SECRET_KEY=<generate-with-openssl-rand-base64-32>

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Services
SVC_ASSET_UNIVERSE=http://localhost:5001
SVC_TWIN_ENGINE=http://localhost:5002
```

See [DEPLOYMENT.md](DEPLOYMENT.md#environment-configuration) for full list.

---

## 📊 Monitoring

### Prometheus

```bash
curl http://localhost:5260/metrics
```

### Grafana Dashboard

Import from: `k8s/dashboards/assetmind-dashboard.json`

### Service Health

```bash
curl http://localhost:5260/api/health
```

---

## 🔐 Security

- [Security Guide](SECURITY.md)
- [Rate Limiting](SECURITY.md#rate-limiting)
- [Circuit Breakers](SECURITY.md#circuit-breakers)
- [SSL/TLS](SECURITY.md#ssltls-configuration)

---

## 📱 Mobile

- [App Store Guide](MOBILE-STORE.md)
- [iOS Build](MOBILE-STORE.md#step-3-build-for-ios)
- [Android Build](MOBILE-STORE.md#step-4-build-for-android)

---

## 🧪 Testing

```bash
# Run integration tests
./integration-tests.sh

# Run service tests
pytest tests/
npm test
```

---

## 📞 Support

- Documentation: [docs.assetmind.ai](https://docs.assetmind.ai)
- Email: support@assetmind.ai
- GitHub Issues: [github.com/assetmind/assetmind/issues](https://github.com/assetmind/assetmind/issues)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

*Built with ❤️ by RTNM Digital*  
*Last updated: June 12, 2026*
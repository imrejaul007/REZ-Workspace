# AssetMind - Financial Intelligence Platform

**AssetMind** is a product of **RTNM Digital / REZ Ecosystem**, powered by **REZ Intelligence** which runs on **HOJAI AI**.

> "Every asset deserves a brain."

**Version:** 8.0 | **Date:** June 11, 2026 | **Status:** ✅ COMPLETE - PRODUCTION READY

---

## Architecture

```
RTNM DIGITAL
│
├── REZ ECOSYSTEM
│   │
│   ├── AssetMind ──────────────► Application Layer
│   │   (Financial Intelligence)
│   │
│   └── REZ Intelligence ────────► Intelligence Layer
│       └──► HOJAI AI ──────────► Foundation Layer
```

**AssetMind** → uses **REZ Intelligence** → which uses **HOJAI AI**

---

## Services by Category

| Category | Ports | Services |
|----------|-------|----------|
| **Intelligence Hub** | 5298 | Hub (orchestration) |
| **Real-Time** | 5299 | WebSocket, SSE |
| **Dashboard** | 3000 | Portfolio UI |
| **Production** | 5000 | Auth, APIs |
| **Council** | 5195 | 10 analysts debate |
| **Reasoning** | 5055 | Causal chains |
| **Event OS** | 5052 | Event intelligence |
| **Copilot** | 5295 | Personal AI |
| **Workflow** | 5290 | Automation |
| **RexMind** | 5160 | 75M params |
| **Twins** | 5002-5005 | Asset, Portfolio, Investor |
| **Data** | 5010+ | 10 connectors |
| **Knowledge** | 5040 | Graph, Ontology |
| **Memory** | 5030-5031 | Memory, Learning |

---

## Quick Start

```bash
# Hub (orchestration)
cd assetmind-intelligence-hub && pip install -r requirements.txt && python src/__init__.py  # 5298

# Real-time (WebSocket)
cd assetmind-realtime && pip install -r requirements.txt && python src/__init__.py  # 5299

# Dashboard
cd assetmind-dashboard && pip install -r requirements.txt && python src/__init__.py  # 3000

# Production (auth, APIs)
cd assetmind-production && pip install -r requirements.txt && python src/__init__.py  # 5000
```

---

## API Examples

### Unified Query (Hub)
```bash
curl -X POST http://localhost:5298/query \
  -d '{"query": "Should I invest in NVIDIA?"}'
```

### WebSocket (Real-Time)
```javascript
ws = new WebSocket("ws://localhost:5299/ws")
ws.send(JSON.stringify({type: "subscribe_alerts"}))
```

### Dashboard
```bash
curl http://localhost:3000/api/portfolio
curl http://localhost:3000/api/recommendations
```

### Auth (Production)
```bash
curl -X POST http://localhost:5000/auth/register \
  -d '{"email": "user@test.com", "password": "test123"}'
```

---

## Deployment

### Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
```

### GitHub Actions
```bash
# CI/CD automatically on push to main
# Tests → Build → Deploy
```

---

## Stats

| Metric | Count |
|---------|--------|
| Total Services | 105+ |
| Lines of Code | 75,000+ |
| Documentation | Complete |
| Docker | Ready |
| CI/CD | Ready |
| Auth | Ready |
| WebSocket | Ready |
| Dashboard | Ready |

---

*Version 5.0 - Intelligence Network - June 9, 2026*
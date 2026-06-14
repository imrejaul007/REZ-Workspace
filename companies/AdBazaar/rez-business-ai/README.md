# REZ Business AI

**Autonomous AI Operating System for Merchants**

> "Your AI business manager that grows your local business automatically."

---

## Features

### Core Engines

| Engine | Description |
|--------|-------------|
| Goal Engine | Set goals, track progress, AI optimizes |
| Playbook Engine | Industry-specific automation |
| Risk Engine | Pre-execution risk assessment |
| Memory Layer | Learns from past actions |
| Campaign Bundles | One-click campaigns |
| Ad Execution Hub | Multi-channel ads |

### Advanced Intelligence

| Engine | Description |
|--------|-------------|
| Decision Engine | Real-time decisions (<50ms) |
| Reinforcement Learning | Self-improving AI |
| A/B Testing | Validate strategies |
| Autonomous Commerce | Self-optimizing |
| Full Attribution | Cross-channel tracking |

### Additional Services

| Service | Description |
|---------|-------------|
| Inventory Prediction | Stock forecasting, reorder alerts |
| Staff Scheduling | Demand-based staffing |
| Voice Commands | Natural language commands |
| Webhook System | Real-time events |
| Admin Dashboard | Manage AI settings |

---

## APIs (40+)

### ML Predictions
```
GET  /api/predict/demand
GET  /api/predict/churn
GET  /api/predict/ltv
POST /api/recommend/campaign
POST /api/optimize/pricing
```

### Campaigns
```
GET  /api/suggestions
POST /api/bundles/:id/execute
POST /api/actions/:id/approve
GET  /api/bundles
GET  /api/decide
```

### Inventory
```
GET  /api/inventory/stock/:productId
GET  /api/inventory/demand/:productId
GET  /api/inventory/reorder/:productId
GET  /api/inventory/alerts/low-stock
POST /api/inventory/bulk-reorder
```

### Staff
```
GET  /api/staff
POST /api/staff
GET  /api/staff/schedule
POST /api/staff/schedule/generate
POST /api/staff/schedule/optimize
GET  /api/staff/forecast/:merchantId
```

### Voice
```
POST /api/voice/command
```

### Webhooks
```
POST /api/webhooks
GET  /api/webhooks
POST /api/events
GET  /api/events
GET  /api/events/types
```

### Admin
```
GET  /api/admin/merchants
GET  /api/admin/merchants/:id
GET  /api/admin/settings/:merchantId
PUT  /api/admin/settings/:merchantId
GET  /api/admin/metrics
GET  /api/admin/actions
GET  /api/admin/campaigns
GET  /api/admin/learnings
GET  /api/admin/alerts
```

---

## Quick Start

```bash
npm install
npm start
curl http://localhost:4059/health
```

---

## Deploy

```bash
# Connect to Render.com
https://render.com → New → Web Service
GitHub: github.com/imrejaul007/REZ-business-ai
PORT: 4059
```

---

## Connected Services

```
REZ-Merchant ─── Products, Orders, Customers
REZ-Intelligence ─── Demand, Weather, Events
REZ-Media ─────── Ads, Campaigns, Engagement
RABTUL ─────────── Notifications, Wallet
```

---

## Port: 4059

**GitHub:** github.com/imrejaul007/REZ-business-ai

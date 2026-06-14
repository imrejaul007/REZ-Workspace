# RisnaEstate Service Catalog

## Complete Service List

### Core Services

| Service | Port | Language | Database | Cache |
|---------|------|----------|----------|-------|
| Gateway | 3000 | TypeScript | — | Redis |
| Property | 4100 | TypeScript | MongoDB | Redis |
| Lead | 4101 | TypeScript | MongoDB | Redis |
| Visa | 4102 | TypeScript | MongoDB | — |
| Referral | 4103 | TypeScript | MongoDB | Redis |
| Broker | 4104 | TypeScript | MongoDB | Redis |
| CRM | 4105 | TypeScript | MongoDB | Redis |
| Media | 4106 | TypeScript | MongoDB | — |
| Builder | 4107 | TypeScript | MongoDB | — |
| Notification | 4108 | TypeScript | MongoDB | — |
| Payment | 4109 | TypeScript | MongoDB | Redis |

### AI/Intelligence Services

| Service | Port | Purpose |
|---------|------|---------|
| Intelligence | 4110 | NRI/HNI/Investor scoring |
| WhatsApp | 4111 | Auto-reply bot |
| Investment | 4112 | EMI/ROI calculators |
| Distribution | 4113 | Lead auto-routing |

### RABTUL Reuse

| Service | Port | Used For |
|---------|------|----------|
| Auth | 4002 | JWT/OAuth |
| Notifications | 4011 | Push/SMS/WhatsApp |
| Wallet | 4004 | Referral payouts |
| Event Bus | 4025 | Real-time |

### REZ Intelligence Reuse

| Service | Port | Purpose |
|---------|------|---------|
| Intent Predictor | 4018 | User intent |
| Predictive Engine | 4123 | Churn/LTV |
| Signal Aggregator | 4142 | Behavioral |
| Identity Graph | 4050 | User identity |

## Port Registry

```
3000-3009   Gateway & Admin
4100-4119   RisnaEstate Core
4120-4139   RisnaEstate AI
4000-4099   RABTUL Services
```

## Environment per Service

Each service needs:
- `PORT` - Listen port
- `MONGODB_URI` - Database
- `INTERNAL_SERVICE_TOKEN` - Auth
- `REDIS_URL` - Cache (optional)

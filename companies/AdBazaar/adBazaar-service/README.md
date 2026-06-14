# AdBazaar Service

Main orchestration service for the AdBazaar platform. Central hub connecting all AdBazaar modules including Campaign Management, Attribution, AI Intelligence, Inventory, Commerce, and Integrations.

## Features

- **Service Registry** - Centralized registry for all platform services
- **Campaign Management** - Create, manage, and optimize campaigns
- **Unified Analytics** - Cross-platform performance metrics
- **Inventory Management** - DOOH, QR, Society, Community, Event inventory
- **Multi-Tenant Support** - Internal, Merchant, and Advertiser tenants
- **Health Monitoring** - Service health and readiness checks

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## API Endpoints

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/api/services` | List all services |
| GET | `/api/services/health` | Service health status |
| GET | `/api/services/:id` | Get service by ID |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign details |
| PATCH | `/api/campaigns/:id` | Update campaign |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Platform statistics |
| GET | `/api/analytics/overview` | Analytics overview |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Inventory status |

### Multi-Tenant
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants` | List tenants |

## Connected Services

| Service | Port | Description |
|---------|------|-------------|
| AdBazaar Service | 4080 | Main orchestration |
| AdBazaar Backend | 4085 | Backend operations |
| Ad Serving | 4007 | Ad delivery |
| QR Campaigns | 4068 | QR code campaigns |
| Unified Campaign | 4500 | Campaign management |
| Tenant Registry | 4510 | Multi-tenant support |
| Inventory Classifier | 4515 | Inventory management |
| Attribution Hub | 4520 | Attribution tracking |
| Flywheel Analytics | 4550 | Analytics |
| AI Gateway | 4560 | AI/ML predictions |
| Integration Hub | 4570 | Service integration |

## Campaign Types

- **Native** - Native advertising formats
- **Display** - Banner and display ads
- **Video** - Video pre-roll and in-stream
- **QR** - QR code campaigns

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4080` | Service port |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `NODE_ENV` | `development` | Environment |

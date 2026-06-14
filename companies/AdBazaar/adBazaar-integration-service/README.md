# AdBazaar Integration Hub

Central integration service that connects all AdBazaar services, acting as the "glue" that makes the ecosystem work together.

## Features

- **Service Registry** - Centralized registry for all AdBazaar services
- **Health Monitoring** - Real-time health checks for all connected services
- **Cross-Platform Campaigns** - Create campaigns across DOOH, QR, and other channels
- **Unified Analytics** - Aggregate metrics from multiple sources
- **Service-to-Service Communication** - Reliable calls with retry logic
- **Attribution Recording** - Track touchpoints across the customer journey

## Connected Services

### Campaign Management
- Unified Campaign Service
- REZ Ads Service
- REZ Marketing

### DOOH Services
- REZ DOOH Service
- AdsQR

### Attribution
- Attribution Hub
- Attribution Hub Enhanced

### Intelligence
- Decision Engine
- Hojai AI Gateway

### Inventory
- Inventory Classifier

### Tenant
- Tenant Registry

### Ecosystem
- ReZ Ride Integration
- Hospitality Integration
- BuzzLocal Integration
- CorpPerks Integration
- Commerce Graph
- Flywheel Analytics

### RABTUL Services
- RABTUL Auth
- RABTUL Wallet
- RABTUL Notifications
- RABTUL Payment

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/services` | Get service registry and status |
| GET | `/api/services/health` | Health check all services |
| GET | `/api/campaigns/:id` | Get campaign data |
| POST | `/api/campaigns` | Create cross-platform campaign |
| GET | `/api/campaigns/:id/metrics` | Get cross-platform metrics |
| POST | `/api/audience` | Get unified audience data |
| POST | `/api/events` | Record attribution event |
| POST | `/api/forward/:service` | Forward request to service |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4570` | Service port |
| `CAMPAIGN_SERVICE_URL` | `http://localhost:4500` | Unified Campaign Service |
| `ADS_SERVICE_URL` | `http://localhost:4007` | Ad Serving |
| `DOOH_SERVICE_URL` | `http://localhost:4018` | DOOH Service |
| `ADSQR_SERVICE_URL` | `http://localhost:4068` | QR Campaigns |
| `ATTRIBUTION_SERVICE_URL` | `http://localhost:4100` | Attribution Hub |
| `ATTRIBUTION_ENHANCED_URL` | `http://localhost:4520` | Enhanced Attribution |

## Budget Allocation

When creating cross-platform campaigns, budget is allocated as:
- **DOOH**: 30% of total budget
- **QR**: 20% of total budget
- **Remaining**: Goes to unified campaign

## Service Configuration

All services share common configuration:
- **Timeout**: 5000ms
- **Retry Attempts**: 3
- **Retry Strategy**: Exponential backoff

# rez-menu

**Restaurant Menu & Ordering Platform**

## Status

⚠️ PARTIAL - 11 microservices, ~201 files

## Overview

Monorepo containing restaurant menu, ordering, payment, and merchant services.

## Services

| Service | Description | Status |
|---------|-------------|--------|
| `rez-api-gateway` | API Gateway | ✅ |
| `rez-auth-service` | Authentication | ✅ |
| `rez-merchant-service` | Merchant management | ✅ |
| `rez-catalog-service` | Menu catalog | ✅ |
| `rez-order-service` | Order management | ✅ |
| `rez-payment-service` | Payment processing | ✅ |
| `rez-wallet-service` | Wallet service | ✅ |
| `rez-notification-events` | Notifications | ✅ |
| `rez-marketing-service` | Marketing | ✅ |
| `rez-gamification-service` | Gamification | ✅ |
| `rez-analytics-events` | Analytics | ✅ |

## Tech Stack

- Node.js / Express
- MongoDB / Mongoose
- Redis
- Docker / Kubernetes

## Quick Start

```bash
# Install dependencies
npm install

# Start all services
docker-compose -f docker-compose.microservices.yml up

# Or start individually
cd rez-api-gateway && npm run dev
```

## Architecture

```
rez-menu/
├── rez-api-gateway/     # API Gateway
├── rez-auth-service/    # Auth service
├── rez-merchant-service/ # Merchant management
├── rez-catalog-service/  # Menu catalog
├── rez-order-service/    # Order management
├── rez-payment-service/  # Payment processing
├── rez-wallet-service/   # Wallet
├── packages/            # Shared packages
│   ├── rez-shared/      # Shared utilities
│   ├── rez-service-core/ # Service core
│   └── rez-ui/          # Shared UI components
```

## Documentation

See `/docs` for detailed architecture documentation.

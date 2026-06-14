# RisnaEstate - Production Deployment Guide

## Overview

RisnaEstate is a production-ready AI-powered real estate platform with 30 microservices.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                             │
│                    (Cloudflare/AWS ALB)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────┴─────┐           ┌─────┴─────┐
              │  Gateway  │           │  Frontend  │
              │   (3000)  │           │  (3001)   │
              └───────────┘           └───────────┘
                    │
    ┌───────────────┼───────────────┬───────────────┐
    │               │               │               │
┌───┴───┐    ┌─────┴─────┐   ┌─────┴─────┐   ┌───┴───┐
│Property│   │   Lead    │   │   Visa    │   │Referrl│
│(4100)  │   │  (4101)   │   │  (4102)   │   │(4103) │
└────┬───┘   └─────┬─────┘   └─────┬─────┘   └───┬───┘
     │             │               │             │
     └─────────────┼───────────────┼─────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────┴────┐         ┌────┴────┐
    │ MongoDB│         │  Redis  │
    └────────┘         └────────┘
```

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 100GB disk space

## Quick Start (Production)

### 1. Clone and Setup

```bash
cd /Users/rejaulkarim/Documents/RTMN/companies/RisnaEstate

# Copy environment file
cp .env.example .env
# Edit .env with your production values
```

### 2. Build All Services

```bash
# Option A: Use the build script
./scripts/build-all.sh

# Option B: Build with Docker
docker-compose build
```

### 3. Deploy

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Verify Deployment

```bash
# Health check all services
curl -s http://localhost:3000/health

# Check all service endpoints
npm run health
```

## Services

### Core Services (7)
| Service | Port | Description |
|---------|------|-------------|
| Gateway | 3000 | API entry point |
| Property | 4100 | Property listings |
| Lead | 4101 | Lead management |
| Visa | 4102 | Golden Visa |
| Referral | 4103 | Commission tracking |
| Broker | 4104 | Broker CRM |
| CRM | 4105 | Follow-ups & visits |
| Media | 4106 | Campaigns |

### Transaction Services (3)
| Service | Port | Description |
|---------|------|-------------|
| Deal | 4119 | Deal management |
| Agreement | 4127 | Contract generation |
| Handover | 4129 | Property handover |

### Intelligence Services (4)
| Service | Port | Description |
|---------|------|-------------|
| Intelligence | 4110 | AI recommendations |
| WhatsApp | 4111 | WhatsApp integration |
| Investment | 4112 | Investment analysis |
| Distribution | 4113 | Distribution network |

### Platform Services (16)
| Service | Port | Description |
|---------|------|-------------|
| Notification | 4108 | Push notifications |
| Payment | 4109 | Payment processing |
| Builder | 4107 | Builder ERP |
| Booking | 4120 | Booking system |
| + 12 more... | | |

## Configuration

### Environment Variables

Required in `.env`:
- `JWT_SECRET` - JWT signing secret
- `INTERNAL_SERVICE_TOKEN` - Internal API auth
- `MONGODB_URI` - MongoDB connection
- `REDIS_URL` - Redis connection

### External Services

- RABTUL Auth (4002)
- RABTUL Payment (4001)
- RABTUL Wallet (4004)
- RABTUL Notifications (4011)

## Health Checks

All services expose:
- `GET /health` - Health status
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

## Monitoring

```bash
# Prometheus metrics
curl http://localhost:3000/metrics

# Check container health
docker inspect risnaestate-gateway-1 | grep -A 10 Health
```

## Scaling

```bash
# Scale a specific service
docker-compose up -d --scale property-service=3

# Update specific service
docker-compose up -d --no-deps risna-property-service
```

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>
```

### Database connection issues
```bash
# Check MongoDB
docker-compose exec mongo mongosh

# Check Redis
docker-compose exec redis redis-cli ping
```

### Build fails
```bash
# Clean and rebuild
docker-compose build --no-cache <service-name>
```

## Backup

```bash
# MongoDB backup
docker-compose exec mongo mongodump --archive=/backup/$(date +%Y%m%d).archive

# Redis backup
docker-compose exec redis redis-cli SAVE
```

## Security

- All services require JWT authentication
- Rate limiting enabled (100 req/min)
- CORS configured for specific origins
- Helmet security headers
- Input sanitization (mongo-sanitize)

## Performance

- Redis caching enabled
- Compression enabled
- Connection pooling
- Health checks for orchestration

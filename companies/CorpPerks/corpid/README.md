# CorpID - Universal Trust, Verification & Reputation Infrastructure

**Trust Infrastructure Platform for the entire RTNM ecosystem.**

## Overview

CorpID provides universal identity verification, CI Scoring (0-1000), and reputation management across all companies and services in the RTNM ecosystem.

## Entity Types

| Type | Prefix | Description |
|------|--------|-------------|
| Individual | CI-IND-XXXXX | Person identity |
| Business | CI-BIZ-XXXXX | Company entity |
| Supplier | CI-SUP-XXXXX | Supply chain partner |
| Merchant | CI-MER-XXXXX | REZ Merchant |
| Driver | CI-DRV-XXXXX | Ride/Delivery driver |
| Franchise | CI-FRN-XXXXX | Franchisee entity |

## Architecture

```
CorpID Platform
├── corpid-api-gateway (4701)      # Unified entry point
├── corpid-identity-service (4702)  # CorpID creation, entity management
├── corpid-verification-service (4703) # KYB/KYC verification
├── corpid-ci-score-service (4704)  # CI Score 0-1000
├── corpid-passport-service (4705)  # Career + Business passports
├── corpid-trust-graph-service (4706) # Relationships
├── corpid-monitor-service (4707)    # Continuous monitoring
├── corpid-risk-service (4708)       # Fraud detection
├── corpid-document-service (4709)    # Document vault
├── corpid-notification-service (4710) # Alerts
├── corpid-partner-service (4711)    # Partner integrations
├── corpid-admin-service (4712)      # Admin dashboard
├── corpid-mobile/                  # React Native Expo app
└── corpid-web/                     # Next.js admin dashboard
```

## CI Score (0-1000)

Composite Trust Score based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Identity | 15% | KYC completion, document verification |
| Employment | 20% | Employment history, tenure |
| Skills | 15% | Certifications, skills verified |
| Reputation | 25% | References, ratings, reviews |
| Compliance | 10% | Background checks, legal |
| References | 15% | Verified professional references |

### Score Tiers

| Range | Tier | Color |
|-------|------|-------|
| 900-1000 | Elite | Gold |
| 750-899 | Premium | Silver |
| 500-749 | Verified | Blue |
| 300-499 | Basic | Gray |
| 0-299 | Unverified | Red |

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB 7.0+
- Redis 7+ (optional, for caching)
- pnpm 8+

### Installation

```bash
cd CorpPerks/corpid

# Install dependencies
pnpm install

# Start MongoDB and Redis (using Docker)
docker-compose up -d

# Start all services
pnpm dev
```

### Starting Individual Services

```bash
# Identity Service
cd services/corpid-identity-service
pnpm dev

# Verification Service
cd services/corpid-verification-service
pnpm dev

# CI Score Service
cd services/corpid-ci-score-service
pnpm dev
```

### Mobile App

```bash
cd apps/corpid-mobile
pnpm install
pnpm start
```

### Web Dashboard

```bash
cd apps/corpid-web
pnpm install
pnpm dev
```

## API Endpoints

### Identity Service (4702)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /identities/individual | Create individual identity |
| POST | /identities/business | Create business identity |
| GET | /identities/:corpId | Get identity |
| PATCH | /identities/:corpId | Update identity |
| GET | /entities | List entities |
| GET | /search | Search entities |

### Verification Service (4703)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /verify/identity | Start KYC |
| POST | /verify/business | Start KYB |
| POST | /verify/employment | Verify employment |
| POST | /verify/education | Verify education |
| GET | /verify/:corpId/status | Get status |

### CI Score Service (4704)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /scores/calculate | Calculate score |
| GET | /scores/:corpId | Get current score |
| GET | /scores/:corpId/history | Score history |
| GET | /scores/:corpId/factors | Score breakdown |

### Passport Service (4705)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /passports/:corpId/career | Career passport |
| GET | /passports/:corpId/business | Business passport |
| GET | /passports/:corpId/wallet | Trust wallet |
| POST | /passports/:corpId/wallet/badge | Add badge |

## Integration Points

| Partner | Purpose |
|---------|---------|
| TalentAI | Candidate verification |
| PeopleOS | Employee onboarding |
| MyTalent | Career passport |
| REZ Ride | Driver trust |
| NeXha | Supplier trust |
| RidZa | Risk evaluation |

## Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/corpid

# Redis
REDIS_URL=redis://localhost:6379

# Security
INTERNAL_SERVICE_TOKEN=your-secret-token
JWT_SECRET=your-jwt-secret

# Service URLs (for gateway)
IDENTITY_SERVICE_URL=http://localhost:4702
VERIFICATION_SERVICE_URL=http://localhost:4703
CI_SCORE_SERVICE_URL=http://localhost:4704
# etc.
```

## Security

- JWT Authentication (RABTUL Auth integration)
- Rate Limiting: 100 req/min per IP
- Helmet security headers
- Input validation with Zod
- Audit logging
- Document encryption at rest

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB |
| Cache | Redis |
| Auth | JWT (RABTUL) |
| Validation | Zod |
| Mobile | React Native (Expo) |
| Web | Next.js 14 |

## Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## License

Private - RTNM Group

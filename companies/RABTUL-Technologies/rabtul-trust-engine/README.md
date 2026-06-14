# RABTUL Trust Engine

> Trust Engine service for RTNM Economic Network - Provides trust scores, payment scores, fulfillment scores, and credit scores for all entities.

## Overview

The RABTUL Trust Engine is a comprehensive trust and credit scoring service that powers the RTNM Economic Network. It provides:

- **Trust Scores**: Overall trust assessment based on payment history, fulfillment, disputes, and verification
- **Credit Scores**: Creditworthiness assessment with risk levels and available credit limits
- **Transaction Limits**: Configurable limits for auto-approval, escrow requirements, and credit terms
- **Can Transact Checks**: Real-time checks to determine if an entity can transact
- **Credit Extension Checks**: Determine if credit can be extended to an entity

## Features

### Trust Score Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Payment Score | 35% | On-time payments, late payments, defaults |
| Fulfillment Score | 25% | Orders fulfilled, partial, failed |
| Dispute Score | 20% | Disputes filed, won, lost |
| Verification Score | 20% | KYC/KYB completion, documents verified |

### Trust Levels

| Level | Score Range |
|-------|-------------|
| Excellent | 80-100 |
| Good | 60-79 |
| Fair | 40-59 |
| Poor | 0-39 |

### Credit Score Ranges

| Level | Score Range | Risk |
|-------|-------------|------|
| Excellent | 750-900 | Low |
| Very Good | 700-749 | Low |
| Good | 650-699 | Medium |
| Fair | 600-649 | Medium |
| Poor | 500-599 | High |
| Very Poor | 300-499 | Very High |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Clone the repository
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/RABTUL-Technologies/rabtul-trust-engine

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

Create a `.env` file:

```env
PORT=4180
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rabtul_trust_engine
LOG_LEVEL=info
```

### Docker

```bash
# Build image
docker build -t rez/rabtul-trust-engine:latest .

# Run container
docker run -p 4180:4180 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/rabtul_trust_engine \
  rez/rabtul-trust-engine:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  rabtul-trust-engine:
    build: .
    ports:
      - "4180:4180"
    environment:
      - PORT=4180
      - MONGODB_URI=mongodb://mongodb:27017/rabtul_trust_engine
    depends_on:
      - mongodb
```

## API Endpoints

### Trust Score

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trust/:entityId` | Get trust score |
| POST | `/api/trust/:entityId/update` | Update trust score |
| GET | `/api/trust/:entityId/history` | Get trust history |

### Credit Score

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credit/:entityId` | Get credit score |
| POST | `/api/credit/:entityId/update` | Update credit score |

### Transaction Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/can-transact` | Check if entity can transact |
| POST | `/api/can-extend-credit` | Check credit eligibility |

### Transaction Limits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/limits/:entityId` | Get transaction limits |
| PUT | `/api/limits/:entityId` | Update transaction limits |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/report/:entityId` | Get combined entity report |

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `/health` | Basic health check |
| `/health/ready` | Readiness check (includes DB) |
| `/health/live` | Liveness check |

## API Examples

### Get Trust Score

```bash
curl http://localhost:4180/api/trust/entity123
```

Response:
```json
{
  "success": true,
  "data": {
    "entityId": "entity123",
    "entityType": "merchant",
    "overallScore": 85,
    "paymentScore": { "score": 90, "onTimePayments": 50, "latePayments": 2, "defaultedPayments": 0 },
    "fulfillmentScore": { "score": 85, "ordersFulfilled": 100, "partial": 5, "failed": 2 },
    "disputeScore": { "score": 80, "disputesFiled": 3, "won": 2, "lost": 1 },
    "verificationScore": { "score": 85, "kycCompleted": true, "kybCompleted": true, "documentsVerified": 5 },
    "trustLevel": "excellent"
  }
}
```

### Update Trust Score

```bash
curl -X POST http://localhost:4180/api/trust/entity123/update \
  -H "Content-Type: application/json" \
  -d '{
    "paymentScore": {
      "score": 95,
      "onTimePayments": 100,
      "latePayments": 2,
      "defaultedPayments": 0
    },
    "changeReason": "On-time payment bonus"
  }'
```

### Check Can Transact

```bash
curl -X POST http://localhost:4180/api/can-transact \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "entity123",
    "amount": 5000
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "entityId": "entity123",
    "amount": 5000,
    "canTransact": true,
    "reason": "Transaction auto-approved",
    "maxAmount": 10000,
    "requiresEscrow": false
  }
}
```

### Check Can Extend Credit

```bash
curl -X POST http://localhost:4180/api/can-extend-credit \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "entity123",
    "amount": 25000
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "entityId": "entity123",
    "amount": 25000,
    "canExtend": true,
    "reason": "Credit extension approved",
    "maxCreditAmount": 50000,
    "availableTerms": [
      { "termDays": 30, "maxAmount": 30000, "interestRate": 15 },
      { "termDays": 60, "maxAmount": 60000, "interestRate": 18 }
    ],
    "riskLevel": "low"
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RABTUL TRUST ENGINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐     │
│  │  Trust Score  │  │ Credit Score  │  │    Limits     │     │
│  │   Service     │  │   Service     │  │   Service     │     │
│  └───────────────┘  └───────────────┘  └───────────────┘     │
│          │                 │                  │                 │
│          └─────────────────┼──────────────────┘                 │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Trust Service                         │   │
│  │  - getTrustScore()    - getCreditScore()                │   │
│  │  - updateTrustScore() - canTransact()                   │   │
│  │  - getTrustHistory()   - canExtendCredit()              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
├─────────────────────────────────────────────────────────────────┤
│                      DATA MODELS                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ TrustScore  │  │ CreditScore │  │Transaction  │          │
│  │  (MongoDB)  │  │  (MongoDB)  │  │   Limit     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### TrustScore

| Field | Type | Description |
|-------|------|-------------|
| entityId | String | Unique entity identifier |
| entityType | Enum | user, merchant, business, partner |
| overallScore | Number | 0-100 composite score |
| paymentScore | Object | Payment history metrics |
| fulfillmentScore | Object | Order fulfillment metrics |
| disputeScore | Object | Dispute resolution metrics |
| verificationScore | Object | KYC/KYB verification metrics |
| trustLevel | Enum | excellent, good, fair, poor |
| history | Array | Score change history |

### CreditScore

| Field | Type | Description |
|-------|------|-------------|
| entityId | String | Unique entity identifier |
| score | Number | 300-900 credit score |
| creditLimit | Number | Maximum credit allowed |
| currentUtilization | Number | Current credit used |
| availableCredit | Number | Credit still available |
| paymentHistory | Array | Recent payment records |
| riskLevel | Enum | low, medium, high, very_high |

### TransactionLimit

| Field | Type | Description |
|-------|------|-------------|
| entityId | String | Unique entity identifier |
| maxAutoApprove | Number | Max amount auto-approved |
| requiresEscrowAbove | Number | Escrow required above this |
| canExtendCredit | Boolean | Credit extension enabled |
| creditTermsAvailable | Array | Available credit terms |
| dailyLimit | Number | Daily transaction limit |
| monthlyLimit | Number | Monthly transaction limit |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - RABTUL Technologies

## Related Services

- [RABTUL Auth Service](https://github.com/rez/rabtul-auth-service)
- [RABTUL Payment Service](https://github.com/rez/rabtul-payment-service)
- [RABTUL Wallet Service](https://github.com/rez/rabtul-wallet-service)
- [HOJAI CorpID](https://github.com/rez/hojai-corpid)

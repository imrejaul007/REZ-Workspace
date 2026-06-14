# CLAUDE.md - Trust Scorer

## Project Overview

**Name:** REZ-trust-scorer
**Type:** SUTAR OS - Trust Layer
**Port:** 4180
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6 - Trust Engine
**Lines:** 358
**Status:** ✅ PRODUCTION READY

## What is Trust Scorer?

Trust Scorer calculates and manages trust scores for all entities (agents, companies, suppliers) in the RTNM ecosystem. It provides the foundation for autonomous trust-based decisions.

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4180 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Features

### 1. Trust Score Calculation

| Feature | Description |
|---------|-------------|
| **Overall Score (0-100)** | Calculated trust score |
| **Weighted Metrics** | Four equally weighted factors |
| **Real-time Updates** | Score updates on payment events |
| **History Tracking** | Full score history |

### 2. Trust Metrics (Weighted 25% each)

| Metric | Weight | Description |
|--------|--------|-------------|
| **Credit Score** | 25% | Financial stability and payment capacity |
| **Payment History** | 25% | Timeliness of past payments |
| **Dispute Rate** | 25% | Percentage of disputes filed |
| **Delivery Success** | 25% | On-time, complete delivery rate |

### 3. Trust Tiers

| Score | Tier | Description | Transaction Limit |
|-------|------|-------------|------------------|
| 90-100 | **Enterprise** | Auto-approved | Full autonomy |
| 80-89 | **Verified** | Standard approval | High limits |
| 70-79 | **Conditional** | Enhanced monitoring | Medium limits |
| 0-69 | **Review** | Manual review required | Low limits |

### 4. Risk Flags

| Feature | Description |
|---------|-------------|
| **Flag Types** | Multiple flag categories |
| **Severity Levels** | low, medium, high |
| **Score Impact** | Automatic score deduction |
| **Description** | Flag details |

### 5. Payment Tracking

| Feature | Description |
|---------|-------------|
| **Payment Records** | Track all payments |
| **Payment Status** | paid, late, defaulted |
| **Days Late** | Calculate lateness |
| **Due/Paid Dates** | Track timeline |

### 6. Entity Types

| Type | Description |
|------|-------------|
| supplier | Product suppliers |
| buyer | Product buyers |
| agent | Autonomous agents |
| company | Companies |

## API Endpoints

### Trust Score

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trust/:entityId` | Get trust score |
| POST | `/api/trust/:entityId/calculate` | Recalculate score |
| PUT | `/api/trust/:entityId` | Update metrics |
| POST | `/api/trust/:entityId/flag` | Raise risk flag |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Record payment |
| GET | `/api/payments` | List payments |

## Score Calculation Formula

```
Trust Score = (Credit Score × 0.25) + 
              (Payment History × 0.25) + 
              (Dispute Rate × 0.25) + 
              (Delivery Success × 0.25)
```

## Risk Flag Impact

| Severity | Score Impact |
|----------|--------------|
| high | -10 points |
| medium | -5 points |
| low | No change |

## Integration

### Upstream
- Payment systems
- Delivery tracking
- Dispute resolution

### Downstream
- SUTAR Decision Engine
- ContractOS
- NegotiationOS

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## File Structure

```
REZ-trust-scorer/
├── src/
│   └── index.ts                    # Main server (all-in-one)
├── package.json
├── tsconfig.json
└── CLAUDE.md (this file)
```

## Notes

- Trust score is 0-100
- Calculated from 4 weighted metrics
- Risk flags affect score
- Tier determines transaction limits

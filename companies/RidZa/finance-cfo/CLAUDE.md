# CLAUDE.md - Finance CFO

## Project Overview

**Name:** Finance CFO  
**Company:** RidZa  
**Type:** CFO Dashboard & Financial Analysis  
**Port:** 3000  
**Tagline:** CFO Dashboard & Financial Analysis

## Product Description

CFO-level financial analysis including cashflow forecasting, burn rate, and runway calculations.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Security:** Helmet, CORS, JWT
- **Validation:** Zod

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## API Endpoints

### Financial Analysis
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cashflow/:tenantId` | GET | Cashflow analysis |
| `/api/runway/:tenantId` | GET | Calculate runway |
| `/api/burnrate/:tenantId` | GET | Calculate burn rate |
| `/api/alerts/:tenantId` | GET | Financial alerts |
| `/api/dashboard/:tenantId` | GET | Complete dashboard |
| `/api/transactions/:tenantId` | POST | Record transaction |
| `/api/financials/:tenantId` | PUT | Update financial data |

## Runway Status
- `healthy` - >12 months runway
- `warning` - 6-12 months runway
- `critical` - <6 months runway

## Features Checklist

- [x] Cashflow analysis
- [x] Runway calculation
- [x] Burn rate analysis
- [x] Financial alerts
- [x] Dashboard endpoint
- [x] Transaction recording
- [x] JWT authentication
- [x] Health check endpoints
- [x] Docker support

**Last Updated:** 2026-06-12

# CLAUDE.md - RidZa Finance OS

## Project Overview

**Name:** RidZa Finance OS
**Company:** RidZa
**Type:** Finance & Insurance
**Port:** 5200
**Tagline:** "Complete Financial Services Platform"

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB (credit, insurance, lending data)
- In-memory stores for quick access

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | Service port (default: 5200) |
| MONGODB_URI | Yes | MongoDB connection |
| STAYOWN_URL | No | StayOwn Hotel OS (default: http://localhost:3899) |

## RABTUL Integration

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | User authentication |
| RABTUL Payment | 4001 | Payment processing |
| RABTUL Wallet | 4004 | Wallet services |

## RTNM Ecosystem Integration (NEW - June 2026)

### StayOwn Hotel OS Integration

RidZa integrates with StayOwn Hotel OS for hotel financial services.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/hotels/:hotelId/finance/overview` | GET | Hotel financial overview |
| `/api/hotels/:hotelId/finance/revenue` | GET | Hotel revenue analytics |
| `/api/hotels/:hotelId/finance/expenses` | GET | Hotel expense breakdown |
| `/api/hotels/:hotelId/finance/occupancy` | GET | Hotel occupancy analytics |
| `/api/hotels/:hotelId/finance/financing` | GET | Hotel credit options |
| `/api/hotels/:hotelId/finance/apply-credit` | POST | Apply for hotel credit |
| `/api/hotels/:hotelId/finance/insurance-needs` | GET | Hotel insurance recommendations |
| `/api/integration/stayown/status` | GET | Check StayOwn integration health |

### Connected Companies

| Company | Service | Integration Type |
|---------|---------|------------------|
| StayOwn | Hotel OS (3899) | Hotel finance & insurance |

## Key Features

### Credit Services
1. **Credit Application** - Apply for credit lines
2. **Credit Profile** - View credit status
3. **Credit Approval** - Admin approval workflow
4. **Credit Disbursement** - Fund disbursement

### Insurance Services
1. **Insurance Quotes** - Get policy quotes
2. **Policy Purchase** - Buy insurance policies
3. **Claim Filing** - File insurance claims
4. **Claim Tracking** - Track claim status

### Lending Services
1. **EMI Calculator** - Calculate loan EMIs
2. **Loan Management** - Manage active loans
3. **Payment Recording** - Record payments
4. **Default Management** - Handle defaults

### Islamic Finance
1. **Zakat Calculator** - Calculate Zakat
2. **Takaful** - Islamic insurance
3. **Ijara** - Lease financing
4. **Mudarabah** - Profit sharing
5. **Murabaha** - Cost-plus financing

### BNPL Services
1. **BNPL Orders** - Buy now pay later
2. **Installment Tracking** - Track payments
3. **Default Management** - Handle defaults

### Remittance
1. **Send Money** - International transfers
2. **Track Transfer** - Track status
3. **Exchange Rates** - Real-time rates

### Portfolio Services
1. **Portfolio View** - Investment overview
2. **Invest** - Add investments
3. **Performance** - Track returns

### AI Features (NEW)
1. **Financial Forecast** - AI-powered forecasting
2. **Product Recommendations** - Personalized products
3. **Fraud Detection** - Transaction monitoring

### Hotel Finance Features (NEW)
1. **Finance Overview** - Complete financial picture
2. **Revenue Analytics** - Revenue breakdown
3. **Expense Tracking** - Cost analysis
4. **Occupancy Analytics** - Occupancy metrics
5. **Credit/Financing** - Hotel credit options
6. **Insurance Needs** - Hotel-specific insurance

## Quick Start

```bash
cd RidZa/services
npm install
npm run dev
# Service runs on port 5200
```

## API Endpoints Summary

### Credit
- POST /api/credit/apply
- GET /api/credit/:customerId
- POST /api/credit/:id/approve
- POST /api/credit/:id/disburse

### Insurance
- POST /api/insurance/quote
- POST /api/insurance/purchase
- GET /api/insurance/:customerId
- POST /api/insurance/:id/claim

### Lending
- POST /api/lending/calculate
- POST /api/lending/approve
- GET /api/lending/:customerId
- POST /api/lending/:id/payment

### Islamic Finance
- POST /api/islamic/zakat
- POST /api/islamic/takaful
- POST /api/islamic/ijara
- POST /api/islamic/mudarabah
- POST /api/islamic/murabaha

### Remittance
- POST /api/remittance/send
- GET /api/remittance/:id
- GET /api/remittance/rates

### AI & Analytics
- POST /api/ai/forecast
- POST /api/ai/recommend
- POST /api/fraud/check
- GET /api/analytics/dashboard

### Hotel Finance (NEW)
- GET /api/hotels/:hotelId/finance/overview
- GET /api/hotels/:hotelId/finance/revenue
- GET /api/hotels/:hotelId/finance/expenses
- GET /api/hotels/:hotelId/finance/occupancy
- GET /api/hotels/:hotelId/finance/financing
- POST /api/hotels/:hotelId/finance/apply-credit
- GET /api/hotels/:hotelId/finance/insurance-needs

---

## HOJAI AI Integration (June 13, 2026)

RIDZA integrates with HOJAI AI services for financial intelligence:

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| 4600 | hojai-business-copilot | ✅ RUNNING | Unified gateway (8 interfaces) |
| 4520 | hojai-memory | ✅ RUNNING | Memory infrastructure (L1-L5) |
| 4550 | hojai-expert-os | ✅ RUNNING | Agent runtime platform |
| 4700 | hojai-meeting-intelligence | ✅ RUNNING | AI meeting management |
| 4708 | genie-project-service | ✅ RUNNING | Project & task management |
| 4752 | hojai-customer-intelligence | ✅ RUNNING | Customer 360 |
| 4755 | hojai-product-intelligence | ✅ RUNNING | Product hub |
| 4756 | hojai-competitive-intelligence | ✅ RUNNING | Competitive intel |
| 4757 | hojai-revenue-intelligence | ✅ RUNNING | Revenue tracking & forecasting |
| 4242 | hojai-goal-os | ✅ RUNNING | Goal management & OKRs |
| 4244 | sutar-flow-os | ✅ RUNNING | Workflow orchestration |
| 4260 | hojai-founder-os | ✅ RUNNING | Founder tools & briefings |
| 4810 | hojai-graph | ✅ RUNNING | Knowledge graph (31 entities) |
| 4820 | hojai-workforce | ✅ RUNNING | AI employee marketplace |
| 4860 | hojai-twin | ✅ RUNNING | Digital twins |
| 4870 | hojai-board | ✅ RUNNING | AI C-Suite advisory board |
| 4241 | sutar-simulation-os | ✅ RUNNING | What-if scenarios |

**Total: 18 HOJAI AI services running**

**Verified Working:**
- ✅ Gateway health endpoint
- ✅ Chat interface (24 industries)
- ✅ Query router with intent classification
- ✅ Skills catalog
- ✅ 120+ skills across 24 industries

---

**Last Updated:** 2026-06-13
# REZ-Invest

**Stock Trading & Investment Platform**

Version: 1.0.0  
Date: June 5, 2026  
Company: **REZ-Consumer**

---

## Overview

REZ-Invest is a comprehensive investment platform providing stock trading, mutual funds, IPO subscriptions, SIP automation, and portfolio analytics. It integrates with the REZ ecosystem via RABTUL for wallet/payments and HOJAI for AI-powered insights.

---

## Competitor Comparison

| Feature | REZ-Invest | Zerodha | Groww | Upstox |
|---------|------------|---------|-------|--------|
| **Stock Trading** | Yes | Yes | Yes | Yes |
| **Mutual Funds** | Yes | Yes | Yes | Yes |
| **IPO Applications** | Yes | Yes | Yes | Yes |
| **SIP Automation** | Yes | Yes | Yes | Yes |
| **Portfolio Analytics** | Yes | Basic | Basic | Basic |
| **AI Recommendations** | Yes | No | No | No |
| **REZ Ecosystem** | Yes | No | No | No |
| **Multi-Asset** | Stocks, MF, IPO, SIP, Bonds | Stocks, MF | Stocks, MF | Stocks, MF |
| **Real-time Alerts** | Yes | Yes | Yes | Yes |
| **Zero Brokerage (MF)** | Yes | Yes | Yes | Yes |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REZ-INVEST ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │   User Client   │
                                    │   (rez-app)     │
                                    └────────┬────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ-INVEST GATEWAY (4800)                          │
│                    JWT Auth │ Rate Limiting │ Logging                     │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   BROKERAGE     │  │    TRADING     │  │   PORTFOLIO     │  │    WALLET       │
│   (4801)        │  │   (4802)       │  │   (4803)        │  │   (4804)        │
│                 │  │                │  │                 │  │                 │
│ - Account Mgmt  │  │ - Order Mgmt   │  │ - Holdings      │  │ - Balance       │
│ - KYC Status    │  │ - Market Data  │  │ - P&L Tracking  │  │ - Deposits      │
│ - Profile       │  │ - Watchlist    │  │ - Analytics     │  │ - Withdrawals   │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │                    │
         └────────────────────┴────────────────────┴────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL INTEGRATIONS                             │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   RABTUL        │   HOJAI-AI      │   NSE/BSE       │   CAMS/KFintech      │
│   (Auth/Wallet) │   (AI Insights) │   (Exchange)    │   (MF Registrar)     │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

---

## Services

| # | Service | Port | Description |
|---|---------|------|-------------|
| 1 | rez-invest-gateway | 4800 | API Gateway, Auth, Rate Limiting |
| 2 | rez-invest-brokerage | 4801 | Account management, KYC, Profile |
| 3 | rez-invest-trading | 4802 | Order execution, Market data, Watchlist |
| 4 | rez-invest-portfolio | 4803 | Holdings, P&L, Analytics |
| 5 | rez-invest-wallet | 4804 | Investment wallet, RABTUL integration |

---

## Features

### Stock Trading
- Place buy/sell orders (CNC, Intraday, MTF)
- Market, Limit, SL, SL-M orders
- Real-time market data
- Order book management
- Position tracking

### Mutual Funds
- Browse and compare funds
- Lump sum investments
- SIP (Systematic Investment Plan)
- Redeem units
- NAV tracking

### IPO Applications
- Upcoming IPO listing
- Application management
- Allotment tracking
- GMP (Grey Market Premium)

### Portfolio Analytics
- Holdings overview
- P&L calculation (Realized/Unrealized)
- Asset allocation
- Performance metrics
- AI-powered insights

---

## API Endpoints

### Gateway (4800)
```
POST   /api/auth/login           - Login with REZ credentials
POST   /api/auth/register        - Register new investor
POST   /api/auth/verify-otp      - Verify OTP
GET    /api/health               - Health check
```

### Brokerage (4801)
```
GET    /api/account              - Get account details
PUT    /api/account/profile      - Update profile
GET    /api/account/kyc          - Get KYC status
POST   /api/account/kyc          - Submit KYC
GET    /api/account/segments     - Get enabled segments
POST   /api/account/segments     - Enable trading segments
```

### Trading (4802)
```
GET    /api/orders               - List orders
POST   /api/orders               - Place order
GET    /api/orders/:id           - Get order details
PUT    /api/orders/:id           - Modify order
DELETE /api/orders/:id           - Cancel order
GET    /api/market/quotes/:symbol - Get quote
GET    /api/market/search        - Search instruments
GET    /api/market/holidays      - Trading holidays
GET    /api/watchlist            - Get watchlist
POST   /api/watchlist            - Add to watchlist
DELETE /api/watchlist/:symbol    - Remove from watchlist
```

### Portfolio (4803)
```
GET    /api/portfolio/holdings   - Get all holdings
GET    /api/portfolio/holdings/:symbol - Get specific holding
GET    /api/portfolio/positions - Get open positions
GET    /api/portfolio/analytics  - Portfolio analytics
GET    /api/portfolio/pnl        - P&L summary
GET    /api/portfolio/allocation - Asset allocation
GET    /api/portfolio/performance - Performance metrics
```

### Wallet (4804)
```
GET    /api/wallet/balance       - Get wallet balance
POST   /api/wallet/deposit       - Deposit funds
POST   /api/wallet/withdraw      - Withdraw funds
GET    /api/wallet/transactions  - Transaction history
GET    /api/wallet/rabbit-balance - RABTUL wallet balance
POST   /api/wallet/rabbit-topup  - Top up from RABTUL
```

---

## Integration Requirements

### RABTUL-Technologies
- **Auth Service** - JWT token validation
- **Wallet Service** - Balance checks, transfers
- **Notification Service** - Push notifications

### HOJAI-AI
- **AI Insights** - Portfolio recommendations
- **Market Intelligence** - Sentiment analysis

### External APIs
- **NSE/BSE** - Exchange connectivity
- **CAMS/KFintech** - Mutual fund operations
- **CDSL/NSDL** - Demat holdings

---

## Getting Started

### Prerequisites
- Node.js 18+
- TypeScript 5+
- Redis (for caching/sessions)

### Installation

```bash
# Clone and install all services
npm install

# Start all services
npm run dev
```

### Individual Service

```bash
cd rez-invest-gateway
npm install
npm run dev
```

### Environment Variables

```env
# Gateway
PORT=4800
JWT_SECRET=your-secret
REDIS_URL=redis://localhost:6379

# Brokerage
PORT=4801
DATABASE_URL=postgresql://localhost:5432/rez_invest

# Trading
PORT=4802
NSE_API_KEY=your-key
BSE_API_KEY=your-key

# Portfolio
PORT=4803

# Wallet
PORT=4804
RABTUL_WALLET_URL=http://localhost:3001
```

---

## Project Structure

```
REZ-Invest/
├── README.md
├── package.json
├── rez-invest-gateway/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── rez-invest-brokerage/
│   ├── src/
│   │   ├── index.ts
│   │   └── routes/
│   │       ├── account.ts
│   │       └── holdings.ts
│   ├── package.json
│   └── tsconfig.json
├── rez-invest-trading/
│   ├── src/
│   │   ├── index.ts
│   │   └── routes/
│   │       ├── orders.ts
│   │       └── market.ts
│   ├── package.json
│   └── tsconfig.json
├── rez-invest-portfolio/
│   ├── src/
│   │   ├── index.ts
│   │   └── routes/
│   │       └── portfolio.ts
│   ├── package.json
│   └── tsconfig.json
└── rez-invest-wallet/
    ├── src/
    │   ├── index.ts
    │   └── routes/
    │       └── wallet.ts
    ├── package.json
    └── tsconfig.json
```

---

## Security

- JWT-based authentication
- Rate limiting (100 req/min per user)
- Input validation with Zod
- HTTPS only in production
- Audit logging

---

## License

Proprietary - REZ-Consumer

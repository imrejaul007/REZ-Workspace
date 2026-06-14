# REZ-Invest - Investment Platform Features

**Status:** ✅ PRODUCTION READY
**Purpose:** Investment tracking platform

---

## SERVICES (5 Microservices)

| Service | Port | Features |
|---------|------|----------|
| **Gateway** | 4800 | API Gateway, Auth |
| **Brokerage** | 4801 | Trade execution, order matching |
| **Trading** | 4802 | Order types, market data |
| **Portfolio** | 4803 | Holdings, P&L tracking |
| **Wallet** | 4804 | Investment balance |

---

## FEATURES

### Portfolio Management

| Feature | Description | Status |
|---------|-------------|--------|
| **Holdings View** | View all investments | ✅ |
| **P&L Tracking** | Profit/loss calculation | ✅ |
| **Allocation** | Asset distribution chart | ✅ |
| **Performance** | Returns over time | ✅ |

### Trading

| Feature | Description | Status |
|---------|-------------|--------|
| **Order Types** | Market, Limit, Stop-loss | ✅ |
| **Order History** | View past orders | ✅ |
| **Watchlist** | Track prices | ✅ |
| **Alerts** | Price notifications | ✅ |

### Wallet

| Feature | Description | Status |
|---------|-------------|--------|
| **Balance** | Available funds | ✅ |
| **Deposits** | Add money | ✅ |
| **Withdrawals** | Transfer out | ✅ |
| **History** | Transaction log | ✅ |

### Analytics

| Feature | Description | Status |
|---------|-------------|--------|
| **Performance Charts** | Line/area charts | ✅ |
| **Comparisons** | vs benchmark | ✅ |
| **Tax Report** | Capital gains | ✅ |

---

## TECHNICAL STACK

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB

---

## PORT ASSIGNMENTS

| Port | Service |
|------|---------|
| 4800 | Gateway |
| 4801 | Brokerage |
| 4802 | Trading |
| 4803 | Portfolio |
| 4804 | Wallet |

---

**Last Updated:** June 12, 2026

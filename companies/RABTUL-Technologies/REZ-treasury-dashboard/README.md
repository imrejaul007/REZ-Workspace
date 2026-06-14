# TreasuryOS Dashboard

**React Dashboard for TreasuryOS - Cash Management, Investment Tracking, and Forecasting**

## Features

- **Dashboard** - KPIs, cash flow charts, investment allocation, alerts
- **Accounts** - Multi-account management (master, operating, reserve, escrow)
- **Investments** - Portfolio tracking (FDs, MFs, bonds), returns, maturity
- **Forecast** - 13-Week Cash Flow Forecast with AI predictions
- **Alerts** - Shortfall alerts, maturity notifications, threshold alerts

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Recharts (Line, Bar, Pie charts)
- React Query + Axios
- React Router

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Main overview with KPIs and charts |
| `/accounts` | Accounts | Treasury account management |
| `/investments` | Investments | Investment portfolio |
| `/forecast` | Forecast | 13-week cash flow forecast |
| `/alerts` | Alerts | Alert management |

## Getting Started

```bash
cd REZ-treasury-dashboard
npm install
npm run dev
# Open: http://localhost:3056
```

## Environment Variables

```env
VITE_API_URL=http://localhost:4055
VITE_INTERNAL_TOKEN=your-token
```

## Project Structure

```
REZ-treasury-dashboard/
├── src/
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   ├── index.css            # Tailwind styles
│   ├── api/
│   │   └── treasury.ts      # API client
│   └── pages/
│       ├── Dashboard.tsx    # Main dashboard
│       ├── Accounts.tsx     # Accounts page
│       ├── Investments.tsx   # Investments page
│       ├── Forecast.tsx     # Forecast page
│       └── Alerts.tsx       # Alerts page
├── public/
│   └── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## API Integration

The dashboard connects to TreasuryOS API at `http://localhost:4055`:

```typescript
// Cash Position
GET /api/v1/accounts/:businessId/position

// Investments
GET /api/v1/investments/:businessId/summary
POST /api/v1/investments

// Forecast
POST /api/v1/forecast/:businessId
GET /api/v1/forecast/:businessId/shortfall

// Alerts
GET /api/v1/alerts/:businessId
POST /api/v1/alerts/:alertId/acknowledge
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

**Status:** ✅ Dashboard Complete with 5 Pages

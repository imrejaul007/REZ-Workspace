# REZ-expense-ui

**Expense Tracking UI for REZ Consumer**

AI-powered expense tracking mobile interface for REZ Consumer app, built with Next.js 14 and Tailwind CSS.

## Overview

REZ-expense-ui provides a mobile-first interface for tracking expenses. It connects to the REZ-expense backend service for expense management, receipt capture, and spending analytics.

## Status

**COMPLETE** - Built June 2026

## Port Configuration

**Default Port: 3013**

Runs on `PORT=3013` (configurable via environment variable).

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3013 |

### RABTUL Services (via .env.example)

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification | http://localhost:4011 |

### REZ Intelligence

| Variable | Description | Default |
|----------|-------------|---------|
| `INTENT_SERVICE_URL` | Intent tracking | http://localhost:4018 |
| `PREDICTIVE_SERVICE_URL` | Predictive analytics | http://localhost:4123 |

## RABTUL Integration

REZ-expense-ui uses the shared RABTUL client for:

1. **Authentication**: Validate user sessions
2. **Analytics**: Track expense patterns and insights
3. **Notifications**: Alert users for budget alerts

## API Integration

### Connected Backend

The UI connects to `REZ-expense` service (port 3013) for:

- `POST /api/expense/add` - Add new expense
- `GET /api/expense/history/:userId` - Get expense history
- `GET /api/expense/summary/:userId` - Get spending summary

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3013](http://localhost:3013) in your browser.

## Features

- **Receipt Photo Capture** - Camera scanner with real-time OCR processing
- **Manual Expense Entry** - Quick add with category selection
- **Category Breakdown** - Interactive pie charts showing spending distribution
- **Monthly Summaries** - Track spending trends over time
- **Merchant Insights** - Discover spending patterns and habits
- **Expense History** - Searchable, filterable transaction history

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Language**: TypeScript

## Project Structure

```
REZ-expense-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home - Scanner + expense list
│   │   ├── add/page.tsx       # Manual expense entry
│   │   ├── history/page.tsx    # Expense history
│   │   └── layout.tsx         # Root layout
│   └── components/
│       ├── ReceiptScanner.tsx  # Camera scanner with OCR
│       ├── ExpenseCard.tsx     # Expense display card
│       └── CategoryBreakdown.tsx # Charts and insights
├── package.json
└── tailwind.config.ts
```

## Mobile-First Design

- Optimized for 375px-428px screens
- Safe area support for iOS notch
- Touch-friendly 44px tap targets
- Smooth animations and transitions

## API Integration

Connect to backend services:

- `POST /api/expense/add` - Create expense
- `GET /api/expense/history/:userId` - List expenses
- `GET /api/expense/summary/:userId` - Get spending analytics

## Expense Categories

| Category | Description |
|----------|-------------|
| `food` | Food and dining |
| `travel` | Transportation |
| `shopping` | Retail purchases |
| `entertainment` | Leisure activities |
| `utilities` | Bills and utilities |
| `healthcare` | Medical expenses |
| `education` | Learning expenses |
| `other` | Miscellaneous |

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-expense | 3013 | Backend expense service |
| REZ-bills | 3012 | Receipt scanning |
| REZ-inbox | 3003 | Smart inbox |

## License

Private - REZ Consumer Application

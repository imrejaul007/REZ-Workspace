# REZ-inbox-ui

**Smart Inbox UI for REZ Consumer**

A modern Next.js web interface for the REZ Smart Inbox service. View, categorize, and manage email receipts, travel confirmations, invoices, and subscriptions in one place.

## Overview

REZ-inbox-ui provides a clean, mobile-first interface for managing smart inbox features. It connects to the REZ-inbox backend service to display parsed email receipts and provides category-based filtering.

## Features

- **Category Filtering**: Filter messages by travel, food, invoices, or subscriptions
- **Email Preview**: View sender, subject, and date at a glance
- **Mobile-First Design**: Optimized for mobile web experience
- **Real-time Updates**: Instant filtering without page reload
- **RABTUL Integration**: Connected to RABTUL services via shared client

## Status

**COMPLETE** - Built June 2026

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Project Structure

```
REZ-inbox-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main inbox page
│   │   └── layout.tsx        # Root layout
│   ├── components/            # UI components
│   ├── services/             # API services
│   ├── integrations/
│   │   └── rabtulClient.ts   # RABTUL integration
│   └── types/                # TypeScript types
├── public/
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Port Configuration

**Default Port: 3010**

Runs on `PORT=3010` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-inbox-ui

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3010](http://localhost:3010) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3003 |

### RABTUL Services (via .env.example)

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification | http://localhost:4011 |

### REZ Services

| Variable | Description | Default |
|----------|-------------|---------|
| `INTENT_SERVICE_URL` | Intent tracking | http://localhost:4018 |
| `PREDICTIVE_SERVICE_URL` | Predictive analytics | http://localhost:4123 |

## Features

### Categories

| Category | Icon | Description |
|----------|------|-------------|
| `all` | All | Show all messages |
| `travel` | Travel | Flight, hotel, booking confirmations |
| `food` | Food | Restaurant orders, food delivery |
| `invoice` | Invoices | Bills, payments due |
| `subscription` | Subscriptions | Recurring service invoices |

### Message Card

Each message displays:
- Sender name
- Email subject
- Category badge
- Date received

### Filtering

Click any category chip to instantly filter messages. The "All" category shows everything.

## RABTUL Integration

REZ-inbox-ui uses the shared RABTUL client for:

1. **Authentication**: Validate user sessions
2. **Analytics**: Track inbox usage patterns
3. **Notifications**: Alert users for new receipts

## API Integration

### Connected Backend

The UI connects to `REZ-inbox` service (port 3003) for:

- `GET /api/messages` - List messages
- `GET /api/messages/:id` - Get message details
- `GET /api/threads` - List conversation threads
- `POST /api/import/email` - Import email

### Example API Call

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages?userId=${userId}`);
const data = await response.json();
```

## Mobile Optimization

- Safe area support for iOS notch
- Touch-friendly 44px minimum tap targets
- Responsive grid layouts
- Optimized for 375px - 428px screens

## Design System

### Colors

- **Primary**: Indigo-600 (#4F46E5)
- **Background**: Gray-50 (#F9FAFB)
- **Surface**: White (#FFFFFF)
- **Text Primary**: Gray-900 (#111827)
- **Text Secondary**: Gray-500 (#6B7280)

### Typography

- Font: System UI (Inter via Tailwind)
- Headings: Bold, 18-20px
- Body: Regular, 14-16px
- Captions: Regular, 12px

## Deployment

### Vercel

```bash
# Build for Vercel
npm run build

# Deploy
vercel deploy
```

### Docker

```bash
# Build image
docker build -t rez-inbox-ui .

# Run container
docker run -p 3010:3000 rez-inbox-ui
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-inbox | 3003 | Backend inbox service |
| REZ-assistant-ui | 3011 | AI assistant UI |
| REZ-expense-ui | 3013 | Expense tracking UI |

## License

Private - REZ Consumer Application

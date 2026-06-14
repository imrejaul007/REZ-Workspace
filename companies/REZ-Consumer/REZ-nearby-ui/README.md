# REZ-nearby-ui

**Location-based Discovery UI for REZ Consumer**

A mobile-first web interface for discovering nearby places, restaurants, shops, and services. Built with Next.js 14 and Tailwind CSS.

## Overview

REZ-nearby-ui provides an intuitive interface for location-based discovery. It connects to the REZ-nearby backend service to display nearby places with category filtering, distance sorting, and ratings.

## Features

- **Category Filtering**: Browse by restaurants, shopping, healthcare, entertainment, services
- **Distance Display**: Show distance to each place
- **Rating Display**: View ratings at a glance
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
REZ-nearby-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main discovery page
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

**Default Port: 3015**

Runs on `PORT=3015` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-nearby-ui

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3015](http://localhost:3015) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3015 |

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
| `restaurant` | Restaurants | Food and dining |
| `shopping` | Shopping | Retail stores |
| `health` | Health | Hospitals, pharmacies |
| `entertainment` | Entertainment | Movies, games, parks |
| `services` | Services | Local services |

### Place Card

Each place displays:
- Place name
- Category
- Distance
- Star rating

### Filtering

Click any category chip to instantly filter places. Results update in real-time.

## RABTUL Integration

REZ-nearby-ui uses the shared RABTUL client for:

1. **Authentication**: Validate user sessions
2. **Analytics**: Track discovery patterns
3. **Location**: Request user location permissions

## API Integration

### Connected Backend

The UI connects to `REZ-nearby` service (port 3015) for:

- `GET /api/places/nearby` - Get nearby places
- `GET /api/search` - Search places
- `GET /api/categories` - List categories

### Example API Call

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/places/nearby?lat=${lat}&lng=${lng}`
);
const data = await response.json();
```

## Mobile Optimization

- Safe area support for iOS notch
- Touch-friendly 44px minimum tap targets
- Responsive grid layouts
- Optimized for 375px - 428px screens
- GPS location permission handling

## Design System

### Colors

- **Primary**: Indigo-600 (#4F46E5)
- **Background**: Gray-50 (#F9FAFB)
- **Surface**: White (#FFFFFF)
- **Text Primary**: Gray-900 (#111827)
- **Text Secondary**: Gray-500 (#6B7280)
- **Rating**: Yellow-500 (#F59E0B)

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
docker build -t rez-nearby-ui .

# Run container
docker run -p 3015:3000 rez-nearby-ui
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-nearby | 3015 | Backend discovery service |
| REZ-assistant-ui | 3011 | AI assistant UI |
| REZ-menu-qr | 3014 | Restaurant QR menus |

## License

Private - REZ Consumer Application

# REZ-scan-ui

**Universal QR Scanner UI for REZ Consumer**

A modern web interface for scanning QR codes and discovering merchants. Built with Next.js 14 and Tailwind CSS with PWA support.

## Overview

REZ-scan-ui provides an intuitive QR scanning experience with scan history and statistics. It connects to the REZ-scan backend service to handle QR parsing, type detection, and routing to appropriate actions.

## Features

- **QR Scanning Interface**: Clean, intuitive scanner UI
- **Scan History**: View past scans with timestamps
- **Type Detection Display**: Shows detected QR type (payment, restaurant, product, etc.)
- **Bottom Navigation**: Easy access to Scan and History views
- **PWA Support**: Installable as a progressive web app
- **Mobile-First Design**: Optimized for mobile web experience
- **RABTUL Integration**: Connected to RABTUL services via shared client

## Status

**COMPLETE** - Built June 2026

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **PWA**: manifest.json, next-pwa

## Project Structure

```
REZ-scan-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Scanner page
│   │   ├── history/page.tsx   # Scan history
│   │   ├── layout.tsx         # Root layout with navigation
│   │   └── globals.css        # Global styles
│   ├── components/            # UI components
│   ├── services/              # API services
│   ├── integrations/
│   │   └── rabtulClient.ts   # RABTUL integration
│   └── types/                 # TypeScript types
├── public/
│   └── manifest.json          # PWA manifest
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Port Configuration

**Default Port: 3017**

Runs on `PORT=3017` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-scan-ui

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3017](http://localhost:3017) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3017 |

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
| `VERIFY_API` | Verify QR service | https://rez-verify-qr.onrender.com |

## Features

### Navigation

| Tab | Icon | Description |
|-----|------|-------------|
| Scan | QR Icon | Main scanning interface |
| History | Clock Icon | View past scans |

### QR Types

The scanner detects and displays the following QR types:

| Type | Icon | Action |
|------|------|--------|
| `payment` | Payment | Initiates payment flow |
| `restaurant` | Restaurant | Opens menu or places order |
| `product` | Product | Shows product details |
| `event` | Event | Opens event details |
| `loyalty` | Card | Shows membership |
| `creator` | User | Opens creator profile |
| `verify` | Shield | Verifies authenticity |
| `smart_link` | Link | Routes to content |

### Scan Result Display

After scanning, users see:
- Detected QR type
- Parsed content
- Recommended action
- Quick action buttons

## RABTUL Integration

REZ-scan-ui uses the shared RABTUL client for:

1. **Authentication**: Validate user sessions
2. **Analytics**: Track scan patterns and popular QR types
3. **Notifications**: Alert users for new content

## API Integration

### Connected Backend

The UI connects to `REZ-scan` service (port 3017) for:

- `POST /api/scan` - Scan QR code
- `GET /api/scan/history/:userId` - Get scan history
- `GET /api/scan/stats/:userId` - Get scan statistics

### Example API Call

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qr_content: 'REZ:restaurant:rest123',
    user_id: 'user123',
    location: { lat: 12.97, lng: 77.59 }
  }),
});
const data = await response.json();
```

## PWA Features

- **Installable**: Add to home screen on mobile
- **Offline Support**: View history when offline
- **Theme Color**: Indigo (#6366F1) theme
- **No Zoom**: Fixed scale for scanner UI

### manifest.json

```json
{
  "name": "REZ Scan",
  "short_name": "Scan",
  "description": "Scan QR codes with REZ",
  "theme_color": "#6366F1",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

## Mobile Optimization

- Safe area support for iOS notch and home indicator
- Touch-friendly 44px minimum tap targets
- Fixed header and bottom navigation
- Optimized for 375px - 428px screens
- Camera permissions handling

## Design System

### Colors

- **Primary**: Indigo-600 (#4F46E5)
- **Background**: Gray-50 (#F9FAFB)
- **Surface**: White (#FFFFFF)
- **Text Primary**: Gray-900 (#111827)
- **Text Secondary**: Gray-500 (#6B7280)
- **Success**: Green-500 (#22C55E)
- **Error**: Red-500 (#EF4444)

### Typography

- Font: System UI (Inter via Tailwind)
- Headings: Semibold, 18-20px
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
docker build -t rez-scan-ui .

# Run container
docker run -p 3017:3000 rez-scan-ui
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-scan | 3017 | Backend scanning service |
| verify-qr-service | 4003 | Warranty verification |
| safe-qr-service | 4001 | QR safety checking |
| REZ-assistant-ui | 3011 | AI assistant UI |

## License

Private - REZ Consumer Application

# REZ-scan

**Universal QR Scanner Service for REZ Consumer**

A comprehensive QR code scanning service that parses any QR type, tracks scan history, and routes to appropriate downstream services. Built with Express, Mongoose, and integrated with REZ Intent Graph.

## Overview

REZ-scan is the universal QR scanner backend for the REZ ecosystem. It handles all QR code types including payments, restaurants, products, events, loyalty cards, and more. It intelligently routes scanned content to the appropriate service and tracks user scanning behavior.

## Features

- **Universal QR Parsing**: Handles any QR code format (REZ, UPI, Razorpay, Paytm, etc.)
- **Type Detection**: Automatically identifies QR type (payment, restaurant, product, etc.)
- **Scan History**: Stores complete scan history with location and context
- **Intent Tracking**: Integrates with REZ Intent Graph for behavior analysis
- **Multi-format Support**: REZ format, UPI, Razorpay, Paytm, generic URLs
- **Statistics Tracking**: Aggregated scan statistics by type

## Status

**COMPLETE** - Built June 2026

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **GeoIP**: geoip-lite for location enrichment

## Project Structure

```
REZ-scan/
├── src/
│   ├── index.ts              # Express app entry point (if standalone)
│   ├── service.ts            # Core service logic
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API route handlers
│   ├── middleware/           # Express middleware
│   └── integrations/         # RABTUL integrations
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Port Configuration

**Default Port: 3017**

The service runs on `PORT=3017` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-scan

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure MongoDB URI in .env
# MONGODB_URI=mongodb://localhost:27017/rez-scan

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Scanning

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/scan` | POST | Scan QR code |

### History

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/scan/history/:userId` | GET | Get scan history |
| `GET /api/scan/stats/:userId` | GET | Get scan statistics |

### Verification (for verify-type QR)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/scan/verify` | POST | Verify warranty QR |

## API Examples

### Scan QR Code

```bash
curl -X POST http://localhost:3017/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_content": "REZ:restaurant:rest123",
    "user_id": "user123",
    "location": {
      "lat": 12.9716,
      "lng": 77.5946,
      "city": "Bangalore"
    },
    "device_id": "device_abc123"
  }'
```

**Response:**
```json
{
  "type": "restaurant",
  "data": "rest123",
  "scanned": true,
  "action": "view_menu"
}
```

### Scan Payment QR

```bash
curl -X POST http://localhost:3017/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_content": "razorpay://pay?ver=1&mid=merchant123&am=500",
    "user_id": "user123"
  }'
```

**Response:**
```json
{
  "type": "payment",
  "data": "razorpay://pay?ver=1&mid=merchant123&am=500",
  "scanned": true,
  "action": "initiate_payment"
}
```

### Get Scan History

```bash
curl http://localhost:3017/api/scan/history/user123
```

**Response:**
```json
{
  "scans": [
    {
      "scan_id": "SCAN-1717500000000",
      "qr_type": "restaurant",
      "qr_content": "REZ:restaurant:rest123",
      "timestamp": "2026-06-04T10:00:00.000Z",
      "action_taken": "scanned"
    }
  ]
}
```

### Get Scan Statistics

```bash
curl http://localhost:3017/api/scan/stats/user123
```

**Response:**
```json
{
  "stats": [
    {"_id": "restaurant", "count": 15},
    {"_id": "payment", "count": 8},
    {"_id": "verify", "count": 3}
  ]
}
```

## QR Code Types

| Type | Description | Routing Action |
|------|-------------|----------------|
| `payment` | UPI/Payment QR | Initiates payment flow |
| `restaurant` | Restaurant menu/order | Opens menu or places order |
| `product` | Product QR | Shows product details |
| `event` | Event ticket | Opens event details |
| `loyalty` | Loyalty card | Shows membership |
| `creator` | Creator content | Opens creator profile |
| `verify` | Warranty/verification | Verifies authenticity |
| `smart_link` | Smart redirect link | Routes to appropriate content |

## RABTUL Integration

REZ-scan integrates with the following RABTUL services:

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication service | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet service | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics service | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification service | http://localhost:4011 |
| `EVENT_BUS_URL` | Event bus for pub/sub | http://localhost:4025 |

### External Service Integrations

| Variable | Description | Default |
|----------|-------------|---------|
| `INTENT_API` | REZ Intent Graph | https://rez-intent-graph.onrender.com |
| `VERIFY_API` | REZ Verify QR service | https://rez-verify-qr.onrender.com |
| `AGENT_API` | REZ Agent service | https://REZ-agent.onrender.com |
| `INTELLIGENCE_API` | REZ Intelligence | https://rez-intelligence.onrender.com |

### Event Types Published

```typescript
interface ScanEvent {
  type: 'qr.scan';
  userId: string;
  scanId: string;
  qrType: string;
  timestamp: Date;
  metadata: {
    qrContent: string;
    location?: { lat: number; lng: number; city?: string };
    deviceId?: string;
    actionTaken: string;
  };
}
```

## QR Content Parsing

### REZ Format
```
REZ:{type}:{reference}:{optional}
```
Examples:
- `REZ:restaurant:rest123` - Restaurant QR
- `REZ:menu:rest123:t1` - Table-specific menu
- `REZ:verify:SN123456` - Warranty verification
- `REZ:payment:order123` - Payment for order

### Payment Formats

**UPI:**
```
upi://pay?pa=merchant@upi&pn=Name&am=100
```

**Razorpay:**
```
razorpay://pay?ver=1&mid=...&am=...
```

**Paytm:**
```
paytmmp://pay?pa=merchant@paytm&...
```

## Data Models

### ScanEvent Schema

```typescript
interface ScanEvent {
  scan_id: string;          // Unique scan ID
  user_id: string;          // User identifier
  qr_type: string;          // Detected QR type
  qr_content: string;       // Raw QR content
  merchant_id?: string;     // Associated merchant
  location?: {
    lat: number;
    lng: number;
    city?: string;
  };
  timestamp: Date;         // Scan timestamp
  action_taken: string;    // What happened after scan
  intent: string[];        // Detected intents
}
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test -- --coverage
```

## Deployment

### Docker

```bash
# Build image
docker build -t rez-scan .

# Run container
docker run -p 3017:3017 --env-file .env rez-scan
```

### Production Considerations

- Use managed MongoDB for production
- Set up index on user_id and timestamp for fast queries
- Configure rate limiting per user/IP
- Add GeoIP database for location enrichment
- Enable scan deduplication

## Security

- QR content is validated and sanitized
- Location data is optional
- Rate limiting: 100 scans per minute per user
- Device ID tracking for fraud detection

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| verify-qr-service | 4003 | Warranty verification |
| safe-qr-service | 4001 | QR safety checking |
| REZ-assistant | 3011 | AI recommendations |
| REZ-save | 3016 | Wishlist management |

## License

Private - REZ Consumer Application

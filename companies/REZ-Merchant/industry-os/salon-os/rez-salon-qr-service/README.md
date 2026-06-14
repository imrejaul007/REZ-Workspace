# Rez Salon QR Service

QR Code Generation, Check-in, and Loyalty Management

**Port:** 3009

## Features

- **QR Code Generation**: Generate unique QR codes for salon check-in and customer identification
- **Bulk QR Generation**: Create multiple QR codes for marketing campaigns or loyalty programs
- **Customer Check-in**: Scan QR codes for seamless customer check-in
- **Queue Management**: Track and manage salon wait times and queue positions
- **Loyalty Accounts**: Manage customer loyalty points and tier levels
- **Point Redemption**: Allow customers to redeem accumulated loyalty points
- **Tier System**: Multi-level loyalty tiers (Bronze, Silver, Gold, Platinum)
- **Check-in History**: Track customer visit history and patterns

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/qr/generate | Generate single QR code |
| POST | /api/qr/generate/bulk | Bulk generate QR codes |
| POST | /api/qr/check-in | Customer check-in via QR |
| GET | /api/qr/verify/:qrData | Verify QR code validity |
| GET | /api/qr/queue/:salonId | Get salon queue status |
| GET | /api/qr/wait-time/:id | Get estimated wait time |
| GET | /api/qr/history/:id | Get check-in history |
| POST | /api/loyalty/account | Create loyalty account |
| GET | /api/loyalty/account/:id | Get loyalty account |
| POST | /api/loyalty/redeem | Redeem loyalty points |
| GET | /api/loyalty/tiers | Get loyalty tier information |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 3009)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Allowed CORS origins
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `X-Internal-Token`: Internal service authentication token

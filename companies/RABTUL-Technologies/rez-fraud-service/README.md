# ReZ Fraud Service

Comprehensive fraud detection for orders, payments, and customer behavior.

## Features

- Velocity attack detection
- Geographic anomaly detection
- Device fingerprinting analysis
- Payment fraud patterns
- Business rule violations
- Real-time risk scoring

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4027 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/rez_fraud |
| ALLOWED_ORIGINS | CORS allowed origins | https://rez.money |

## API Endpoints

### Fraud Checking

- `POST /api/fraud/order` - Check order for fraud
- `POST /api/fraud/payment` - Check payment for fraud
- `POST /api/fraud/customer` - Check customer for fraud

### Statistics

- `GET /api/fraud/stats` - Get fraud statistics

### Health

- `GET /health` - Service health check

## Detection Capabilities

### Velocity Attacks

- Orders per hour/day limits
- Payment attempts per hour
- Multiple cards per hour
- Amount velocity tracking

### Geographic Anomalies

- Impossible travel detection
- Shipping/billing mismatch
- High-risk country detection

### Device Fingerprinting

- Multiple customers per device
- Suspicious user agents
- Incomplete fingerprints

## Risk Levels

| Level | Score Range | Action |
|-------|-------------|--------|
| Low | 0-39 | Allow |
| Medium | 40-59 | Review |
| High | 60-79 | Block |
| Critical | 80-100 | Block |

## Development

```bash
# Type check
npm run typecheck

# Run tests
npm test
```

## License

MIT

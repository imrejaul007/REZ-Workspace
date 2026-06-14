# REZ Payment Service

Core backend service handling payment processing, wallet operations, and transaction reconciliation.

## Features

- **Payment Processing**: Razorpay integration with webhook handling
- **Wallet Operations**: Coin and balance management
- **Transaction Reconciliation**: Automated reconciliation jobs
- **Lost Coins Recovery**: Background worker for orphaned coin recovery
- **Metrics**: Prometheus-compatible metrics endpoint

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RAZORPAY_KEY_ID` | Razorpay API key | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification | Yes |
| `INTERNAL_SERVICE_TOKENS_JSON` | JSON array of valid service tokens | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `SENTRY_DSN` | Sentry monitoring | No |
| `JWT_SECRET` | JWT verification secret | Yes |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm test         # Run tests
npm run lint     # Lint code
```

## API Endpoints

- `POST /api/webhooks/razorpay` - Razorpay webhook handler
- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/:id` - Get payment status
- `GET /api/wallet/:userId` - Get wallet balance
- `POST /api/wallet/credit` - Credit wallet
- `GET /metrics` - Prometheus metrics

## License

MIT

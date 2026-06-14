# REZ Payment Gateway Service

Multi-Gateway Payment Processing

**Port:** 4032

## Features

- Multi-gateway payment processing (Razorpay, Stripe, Paytm)
- UPI QR code generation
- Bank transfer support
- Cash payments
- Payment verification and confirmation
- Full refund support (full and partial)
- Webhook handling for payment gateways
- Payment statistics and analytics
- Hotel-specific gateway configuration

## Supported Gateways

| Gateway | Methods | Currencies |
|---------|---------|-----------|
| Razorpay | Card, UPI, Netbanking, Wallet, EMI | INR |
| Stripe | Card, UPI, Bank Transfer | USD, EUR, GBP, INR, AED, SGD |
| Paytm | UPI, Wallet, Netbanking, Card | INR |
| UPI QR | QR Code | INR |
| Bank Transfer | - | INR, USD |
| Cash | - | INR, USD, EUR |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/gateways | List supported gateways |
| GET | /api/gateways/hotel/:hotelId | Get hotel gateway configs |
| POST | /api/gateways/config | Configure gateway |
| POST | /api/payments/create | Create payment intent |
| POST | /api/payments/:paymentId/verify | Verify payment (Razorpay) |
| POST | /api/payments/:paymentId/confirm | Confirm payment (webhook) |
| GET | /api/payments/:paymentId | Get payment details |
| GET | /api/payments/hotel/:hotelId | List hotel payments |
| POST | /api/payments/:paymentId/cancel | Cancel pending payment |
| POST | /api/refunds | Create refund |
| GET | /api/refunds/:refundId | Get refund details |
| POST | /api/webhooks/razorpay | Razorpay webhook |
| POST | /api/webhooks/stripe | Stripe webhook |
| GET | /api/stats/:hotelId | Get payment statistics |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4032 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_payments | MongoDB connection string |
| RAZORPAY_KEY_ID | - | Razorpay API key ID |
| RAZORPAY_KEY_SECRET | - | Razorpay API key secret |
| STRIPE_SECRET_KEY | - | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | - | Stripe webhook secret |
| PAYTM_MERCHANT_ID | - | Paytm merchant ID |
| PAYTM_MERCHANT_KEY | - | Paytm merchant key |
| PAYTM_ENVIRONMENT | staging | Paytm environment |

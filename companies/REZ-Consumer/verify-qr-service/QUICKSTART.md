# Quick Start Guide

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Option 1: One-Command Setup (Recommended)

```bash
cd verify-qr-service
./deploy.sh
```

This will:
1. Start MongoDB, Redis, and the API service
2. Initialize the database with all schemas
3. Seed sample data (warranty plans, service center)

## Option 2: Manual Setup

```bash
# Start dependencies
docker compose up -d mongo redis

# Install and run locally
npm install
npm run dev
```

## Option 3: Development Mode (with hot reload)

```bash
# Start dependencies only
docker compose up -d mongo redis

# In another terminal
cd verify-qr-service
npm install
npm run dev
```

## Services

After starting, these services are available:

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:4003 | REST API |
| Health | http://localhost:4003/health | Health check |
| Dashboard | http://localhost:3000 | Web UI (run separately) |
| MongoDB | localhost:27017 | Database |
| Redis | localhost:6379 | Cache |

## API Health Check

```bash
curl http://localhost:4003/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "REZ Verify QR Service",
  "version": "2.0.0",
  "features": ["..."]
}
```

## Dashboard Setup

```bash
cd ../verify-qr-dashboard
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `WHATSAPP_*` - WhatsApp Cloud API credentials
- `RAZORPAY_*` - Razorpay payment credentials
- `INTERNAL_KEY` - Internal service authentication

## Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f api

# Restart services
docker compose restart

# Rebuild (after code changes)
docker compose up -d --build
```

## Test the API

```bash
# Verify a product
curl -X POST http://localhost:4003/api/verify \
  -H "Content-Type: application/json" \
  -d '{"serial_number": "TEST123"}'

# Get warranty plans
curl http://localhost:4003/api/warranty-plans

# Get dashboard
curl http://localhost:4003/oem/demo_brand/dashboard
```

## Troubleshooting

### Port already in use

```bash
# Check what's using port 4003
lsof -i :4003

# Kill the process
kill -9 <PID>
```

### MongoDB connection failed

```bash
# Check MongoDB logs
docker compose logs mongo

# Restart MongoDB
docker compose restart mongo
```

### Service not starting

```bash
# View all logs
docker compose logs

# Check API logs
docker compose logs api
```

## Production Deployment

For production, use the full Docker Compose setup:

```bash
# Set environment variables
export MONGO_USER=admin
export MONGO_PASSWORD=your-secure-password
export WHATSAPP_ACCESS_TOKEN=your-token
export RAZORPAY_KEY_ID=your-key
export RAZORPAY_KEY_SECRET=your-secret

# Start all services
docker compose -f docker-compose.yml up -d
```

## Next Steps

1. Set up WhatsApp Cloud API credentials
2. Configure Razorpay for payments
3. Add your brand in OEM Dashboard
4. Start generating serials for your products

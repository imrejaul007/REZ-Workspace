# REZ Developer Portal

API documentation and developer resources for REZ Merchant ecosystem.

## Overview

Self-service portal for developers to:
- View API documentation
- Generate API keys
- Test endpoints
- View rate limits and quotas

## Port

Configured via environment variables. Default: 3000

## Dependencies

- express
- helmet
- express-rate-limit
- swagger-ui-express

## Features

- Interactive API documentation (Swagger)
- API key management
- Usage analytics
- Webhook testing

## API Endpoints

- `GET /health` - Health check
- `GET /docs` - Swagger documentation
- `POST /api-keys` - Generate API key
- `GET /usage/:keyId` - View usage stats

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=3000
```

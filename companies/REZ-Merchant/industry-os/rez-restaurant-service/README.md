# REZ Restaurant Service

Core restaurant operations service for the REZ platform.

## Features

- Restaurant profile management
- Menu and catalog management
- Order processing
- Inventory tracking
- Table management
- Reservation handling

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev

# Production build
npm run build
npm start
```

## Docker

```bash
# Build and run
docker build -t rez-restaurant .
docker run -p 4012:4012 rez-restaurant

# Or use docker-compose
docker-compose up -d
```

## Environment Variables

See `.env.example` for all configuration options.

## Port

| Service | Port |
|---------|------|
| Restaurant Service | 4012 |

## Integrations

- RABTUL Auth (4002)
- RABTUL Order (4006)
- RABTUL Payment (4001)
- RABTUL Catalog (4007)

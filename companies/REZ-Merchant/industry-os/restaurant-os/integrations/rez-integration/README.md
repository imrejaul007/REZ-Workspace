# REZ Restaurant OS Integration

Central integration hub for restaurant ecosystem services.

## Overview

Orchestrates communication between restaurant services:
- Menu Service
- POS Service
- KDS Service
- Inventory Service
- CRM Service

## Dependencies

- express
- helmet
- express-rate-limit

## Architecture

```
┌─────────────┐
│   Gateway   │ ← Entry point
└──────┬──────┘
       │
       ├── Menu Service
       ├── POS Service
       ├── KDS Service
       ├── Inventory
       └── CRM
```

## Features

- Service discovery
- Request routing
- Health monitoring
- Error handling
- Rate limiting

## API Endpoints

- `GET /health` - Health check
- `POST /orders` - Route to POS/KDS
- `GET /menu/:merchantId` - Get menu

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=4000
MENU_SERVICE_URL=http://localhost:4030
POS_SERVICE_URL=http://localhost:4081
KDS_SERVICE_URL=http://localhost:4014
```

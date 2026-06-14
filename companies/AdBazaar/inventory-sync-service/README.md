# Inventory Sync Service

Real-time inventory synchronization for AdBazaar.

## Overview

Complete inventory management with:
- Multi-warehouse support
- Stock reservation/release
- Low stock alerts
- Sync status tracking
- Webhook notifications

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inventory` | Create inventory |
| GET | `/api/inventory/:id` | Get inventory |
| PUT | `/api/inventory/:id` | Update inventory |
| GET | `/api/inventory/sync` | Get sync status |
| POST | `/api/inventory/sync` | Initiate sync |
| POST | `/api/inventory/:id/reserve` | Reserve stock |
| POST | `/api/inventory/:id/release` | Release stock |
| POST | `/api/inventory/:id/webhook` | Trigger webhook |

## Port

**5111**
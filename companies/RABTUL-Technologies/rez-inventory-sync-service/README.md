# REZ Inventory Sync Service

**Port:** 4010

Unified real-time inventory synchronization across POS, Catalog, and E-Commerce connectors.

## Features

| Feature | Description |
|---------|-------------|
| **Real-time Sync** | Redis pub/sub for instant updates |
| **Multi-source** | Catalog, POS, Shopify, WooCommerce |
| **Reservation System** | Reserve → Commit/Release flow |
| **Low Stock Alerts** | Automatic alerts when stock falls below threshold |
| **Conflict Resolution** | Catalog vs POS stock reconciliation |
| **SSE Streaming** | Real-time inventory updates via Server-Sent Events |

## Quick Start

```bash
cd RABTUL-Technologies/rez-inventory-sync-service
npm install
cp .env.example .env
npm run dev
```

## API Endpoints

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory` | Get inventory across all sources |
| GET | `/api/v1/inventory/low-stock` | Get low stock items |
| PATCH | `/api/v1/inventory/:sku` | Update inventory item |

### Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sync/trigger` | Trigger full sync |
| GET | `/api/v1/sync/status` | Get sync status |
| POST | `/api/v1/sync/shopify` | Sync to Shopify |
| POST | `/api/v1/sync/woocommerce` | Sync to WooCommerce |

### Reservation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reserve` | Reserve inventory |
| POST | `/api/v1/release` | Release reservation |
| POST | `/api/v1/commit` | Commit reservation |

### Real-time Updates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory/stream/:merchantId` | SSE stream for updates |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  REZ Inventory Sync Service                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │    POS     │  │  Catalog   │  │  Connectors │          │
│  │  Service  │  │  Service   │  │Shopify|Woo │          │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘          │
│         │                │                │                    │
│         └────────────────┼────────────────┘                    │
│                          │                                     │
│                 ┌────────▼────────┐                          │
│                 │  Sync Engine   │                           │
│                 │                │                           │
│                 │• Compare stocks│                           │
│                 │• Resolve conflicts│                         │
│                 │• Apply changes │                           │
│                 └────────┬────────┘                          │
│                          │                                     │
│  ┌──────────────────────┼──────────────────────────────┐      │
│  │                      │                              │      │
│  ▼                      ▼                              ▼      │
│ ┌─────────┐     ┌─────────────┐     ┌──────────────┐     │
│ │  Redis  │     │    SSE     │     │  Scheduled  │     │
│ │ Pub/Sub │     │  Streaming │     │   Alerts    │     │
│ └─────────┘     └─────────────┘     └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Sync Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│   POS    │────────►│  Sync   │────────►│ Catalog │
│          │         │ Service │         │         │
│ stock=50 │         │ Compare │         │ stock=45│
└──────────┘         └────┬─────┘         └─────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Conflict?  │
                   └──────┬──────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Resolve    │
                   │  Use POS    │
                   │  as truth   │
                   └─────────────┘
```

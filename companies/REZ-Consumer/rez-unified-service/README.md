# REZ Unified Service

**Type:** Express.js + TypeScript  
**Status:** ✅ Production Ready  
**Company:** REZ-Consumer

---

## Overview

Gateway service that connects the REZ-Consumer app to all other REZ backend services, acting as a single entry point.

```
┌─────────────────────────────────────────────────────────────┐
│                    REZ UNIFIED SERVICE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Consumer App ──▶ Unified Service ──▶ All REZ Services    │
│                                                             │
│  Auth | Wallet | Orders | Payments | Catalog               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

| Layer | Description |
|-------|-------------|
| **Gateway** | Single entry point |
| **Routing** | Route to correct service |
| **Auth** | JWT validation |
| **Rate Limiting** | Protect services |

---

## Connected Services

| Service | Purpose |
|---------|---------|
| Auth Service | User authentication |
| Wallet Service | Coins & balance |
| Order Service | Order management |
| Payment Service | Payments |
| Catalog Service | Products |

---

## Quick Start

```bash
cd REZ-Consumer/rez-unified-service
npm install
npm run dev
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/*` | ANY | Route to services |

---

## License

Internal REZ Service - All Rights Reserved

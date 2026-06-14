# Karma Foundation - karma-service

> **Tagline:** "Impact, Trust & Community Good"
> **Purpose:** Social impact and NGO ecosystem backend

---

## Company

**Name:** Karma Foundation
**Git Repo:** `karma-foundation/karma-service`
**Port:** 3009

---

## Tech Stack

- Node.js, Express, TypeScript
- MongoDB with Mongoose
- Redis for caching/sessions
- BullMQ for job queues

---

## Quick Start

```bash
cd karma-service
npm install
npm run build
npm start
```

---

## Project Structure

```
karma-service/
├── src/
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   ├── engines/          # Core algorithms
│   ├── models/           # MongoDB models
│   ├── middleware/        # Auth, validation
│   ├── workers/          # Background jobs
│   └── config/           # Configuration
├── __tests__/            # Test files
├── docs/                 # API documentation
└── package.json
```

---

## API Endpoints

### Karma Points
```
GET  /api/karma/user/:userId              # Get karma profile
GET  /api/karma/user/:userId/level         # Get level info
GET  /api/karma/user/:userId/history       # Conversion history
POST /api/karma/verify/checkin             # Check-in
POST /api/karma/verify/checkout            # Check-out
GET  /api/karma/missions                  # Get missions
GET  /api/karma/micro-actions             # Get micro actions
```

### Communities
```
GET  /api/karma/communities               # List communities
GET  /api/karma/communities/:slug         # Community detail
POST /api/karma/communities/:slug/follow  # Follow community
POST /api/karma/communities/:slug/posts   # Create post
```

### Leaderboard
```
GET  /api/karma/leaderboard               # Get leaderboard
GET  /api/karma/leaderboard/me            # Get user rank
```

### Batch (Admin)
```
GET  /api/karma/batch                     # List batches
GET  /api/karma/batch/:id/preview        # Preview conversion
POST /api/karma/batch/:id/execute        # Execute conversion
POST /api/karma/batch/pause-all         # Kill switch
```

### Reports
```
GET  /api/karma/report                    # Impact report PDF
GET  /api/karma/resume                    # Impact resume JSON
GET  /api/karma/resume/pdf               # Impact resume PDF
```

### CSR (Admin)
```
GET  /api/karma/csr/dashboard             # Corporate dashboard
POST /api/karma/csr/allocate              # Allocate karma credits
POST /api/karma/csr/partner              # Create partner
GET  /api/karma/csr/report/:partnerId    # CSR report
```

### Health
```
GET  /health                              # Health check
GET  /health/live                        # Liveness probe
GET  /health/ready                       # Readiness probe
GET  /metrics                            # Prometheus metrics
```

---

## Level System

| Level | Active Karma | Conversion Rate |
|-------|-------------|----------------|
| L1 | 0-999 | 25% |
| L2 | 1000-2999 | 50% |
| L3 | 3000-5999 | 75% |
| L4 | 6000+ | 100% |

---

## Database Models

| Model | Purpose |
|-------|---------|
| `KarmaProfile` | User level, trust score, karma |
| `EarnRecord` | Per-event karma with verification |
| `Batch` | Weekly conversion batches |
| `KarmaEvent` | Event configuration |
| `CSRPool` | Corporate CSR coin pool |
| `CauseCommunity` | Cause communities |
| `Badge` | Achievement badges |
| `MicroAction` | Daily quick actions |

---

## Environment Variables

```env
PORT=3009
MONGODB_URI=mongodb://localhost:27017/karma_foundation
REDIS_URL=redis://localhost:6379
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
JWT_SECRET=<min-32-chars>
INTERNAL_SERVICE_TOKEN=<secret>
QR_SECRET=<hmac-secret>
SENTRY_DSN=<sentry-key>
```

---

## Security

- ✅ QR HMAC-SHA256 with `timingSafeEqual`
- ✅ Atomic karma updates (aggregation pipeline)
- ✅ Redis distributed locks (atomic SET NX EX)
- ✅ 5-minute QR replay protection
- ✅ Fail-closed `QR_SECRET` validation
- ✅ Weekly cap enforcement
- ✅ JWT secret validation (min 32 chars)
- ✅ Strict TypeScript mode enabled
- ✅ CORS origin validation
- ✅ Structured logging with logger
- ✅ Leaderboard endpoint requires auth

### Audit Status (June 2026)
- ✅ TypeScript strict mode enabled
- ✅ CORS requires explicit origin in production
- ✅ Redis lock uses atomic SET NX EX
- ✅ Console.log replaced with structured logger
- ✅ Booking approval validates boolean explicitly
- ⏳ `@ts-nocheck` removal (ongoing)
- ⏳ Zod validation on routes (ongoing)

---

## Related Services

| Service | Purpose |
|---------|---------|
| RABTUL Auth | User authentication |
| RABTUL Wallet | Coin storage |
| RABTUL Payments | Payment processing |
| karma-loyalty-bridge | Karma → REZ conversion |

---

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#22C55E` | Impact/Growth |
| Secondary | `#FACC15` | Reward/Value |
| Trust | `#3B82F6` | Trust elements |

---

**Last Updated:** May 27, 2026

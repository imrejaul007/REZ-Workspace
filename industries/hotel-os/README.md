# Hotel OS

> Hotel Property Management Platform

**Port:** 5025 | **Microservices:** 8447, 8444, 8448 | **Status:** ✅ Production Ready

## Overview

TypeScript-based microservice platform for hotel property management featuring specialized twin services.

## Quick Start

```bash
cd industries/hotel-os
npm install

# Start main service
node src/index.js  # Port 5025

# Start microservices (separate terminals)
node src/services/guest-twin/index.js    # Port 8447
node src/services/room-twin/index.js     # Port 8444
node src/services/property-twin/index.js  # Port 8448
```

Access at: http://localhost:5025

## Microservices Architecture

| Service | Port | Description |
|---------|------|-------------|
| Main Hotel OS | 5025 | Orchestration |
| Guest Twin | 8447 | Guest management |
| Room Twin | 8444 | Room management |
| Property Twin | 8448 | Property operations |

## Digital Twins

- **Guest Twin** - Guest profiles, preferences
- **Room Twin** - Room inventory, status
- **Property Twin** - Property operations
- **Booking Twin** - Reservations

## AI Agents

- Concierge, Housekeeping, Upsell, Revenue, GuestFeedback, StaffScheduling

## Documentation

- [CLAUDE.md](CLAUDE.md) - Developer guide
- [FEATURES.md](FEATURES.md) - Feature documentation

## Related

- [RTMN Platform Hub](../platform/rtmn-hub/README.md)
- [Hospitality OS](../hospitality-os/README.md)

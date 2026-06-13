# 👥 TwinOS Hub

## Overview

**Service Name:** TwinOS Hub  
**Version:** 1.0.0  
**Location:** `core/twinos-hub/`  
**Purpose:** Central repository for all 113 digital twins across 24 industries

**Status:** ✅ PRODUCTION READY  
**Last Updated:** June 13, 2026

---

## Quick Start

```bash
cd core/twinos-hub
npm install
npm start
```

---

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Twin Registry | Central registry for 113 twins | ✅ |
| 24 Industries | Coverage across all industries | ✅ |
| Twin Types | Employee, Customer, Company, Merchant | ✅ |
| Twin Creation | API for creating twins | ✅ |
| Twin Lookup | Fast twin retrieval | ✅ |
| Twin Updates | Real-time twin updates | ✅ |
| Redis Caching | Fast lookups | ✅ |

### Twin Types

| Type | Count | Description |
|------|-------|-------------|
| Employee Twin | 30+ | Employee digital representations |
| Customer Twin | 30+ | Customer behavior twins |
| Company Twin | 25+ | Company profile twins |
| Merchant Twin | 28+ | Merchant analytics twins |

---

## Industries Covered (113 Twins)

| Industry | Twins |
|----------|-------|
| Legal | 5 |
| Healthcare | 5 |
| Finance | 5 |
| Retail | 5 |
| Real Estate | 5 |
| Manufacturing | 5 |
| Hospitality | 5 |
| Education | 5 |
| + 16 more | 73+ |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/twins` | List all twins |
| GET | `/twins/:id` | Get twin by ID |
| POST | `/twins` | Create twin |
| PUT | `/twins/:id` | Update twin |
| GET | `/twins/type/:type` | Twins by type |
| GET | `/twins/industry/:industry` | Twins by industry |
| GET | `/twins/search` | Search twins |

---

## Architecture

```
TwinOS Hub
├── Twin Registry
├── Twin Factory
├── Twin Storage
├── Redis Cache
├── Twin API
└── Express Server
```

---

## Twin Data Model

```json
{
  "id": "twin-123",
  "type": "customer",
  "industry": "retail",
  "profile": {},
  "behavior": {},
  "preferences": {},
  "createdAt": "2026-01-01",
  "updatedAt": "2026-06-13"
}
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| ioredis | Redis client |
| winston | Logging |
| uuid | UUID generation |
| dotenv | Environment config |

---

## Related Documentation

- [AgentOS Hub CLAUDE.md](../agentos-hub/CLAUDE.md)
- [HOJAI AI CLAUDE.md](../../companies/hojai-ai/CLAUDE.md)
- [RTNM-COMPANIES-AUDIT.md](../../RTNM-COMPANIES-AUDIT.md)

---

**Built with ❤️ by RTNM**

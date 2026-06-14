# HOJAI COMMAND CENTER

**Company:** HOJAI AI  
**Port:** 0000  
**Version:** 1.0.0  
**Status:** ✅ **BUILT** (June 13, 2026)

---

## Overview

command center service for the HOJAI AI ecosystem.

## Tech Stack

- Node.js 20+, Express.js 4.x, TypeScript 5.x, MongoDB 6.x, Zod 3.x, Pino

## Security

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| API Key Auth | ✅ |
| Rate Limiting | ✅ |
| Input Validation | ✅ |
| Graceful Shutdown | ✅ |
| Health Checks | ✅ |

## API Endpoints

### Health
- `GET /health` - Full health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Main API
See specific routes in src/index.ts

---

## Related Documents

| Document | Location |
|----------|----------|
| README.md | ./README.md |
| RTNM-COMPANIES-AUDIT.md | ../../../RTNM-COMPANIES-AUDIT.md |

---

**Last Updated:** June 13, 2026  
**Built by:** Claude Code

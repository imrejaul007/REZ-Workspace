# REZ Platform - Service Status Page
**Status:** Live - status.rez.money

---

## Current Status

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│    🟢 ALL SYSTEMS OPERATIONAL                                   │
│                                                                  │
│    Last checked: May 28, 2026 10:30 AM IST                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Status

### Core Services

| Service | Status | Uptime | Last Incident |
|---------|--------|--------|---------------|
| API Gateway | 🟢 Operational | 99.99% | None |
| Auth Service | 🟢 Operational | 99.98% | May 15, 2026 |
| Payment Service | 🟢 Operational | 99.97% | None |
| Wallet Service | 🟢 Operational | 99.99% | None |
| Order Service | 🟢 Operational | 99.95% | None |
| Catalog Service | 🟢 Operational | 99.98% | None |
| Search Service | 🟢 Operational | 99.99% | None |
| Notifications | 🟢 Operational | 99.90% | May 10, 2026 |

### Infrastructure

| Service | Status | Uptime |
|---------|--------|--------|
| Redis Cache | 🟢 Operational | 99.99% |
| MongoDB | 🟢 Operational | 99.98% |
| Event Bus | 🟢 Operational | 99.99% |

### QR Cloud

| Service | Status | Uptime |
|---------|--------|--------|
| QR Generation | 🟢 Operational | 99.99% |
| QR Analytics | 🟢 Operational | 99.95% |
| Scan Tracking | 🟢 Operational | 99.98% |

---

## Incidents

### May 15, 2026 - Auth Service Degradation (Resolved)

**Duration:** 12 minutes (14:30 - 14:42 IST)

**Impact:** Login latency increased from 50ms to 800ms

**Root Cause:** Redis connection pool exhaustion during traffic spike

**Resolution:** Increased connection pool size and added circuit breaker

**Status:** ✅ Resolved

---

### May 10, 2026 - Notifications Delay (Resolved)

**Duration:** 25 minutes (09:15 - 09:40 IST)

**Impact:** Push notifications delayed by 5-15 minutes

**Root Cause:** BullMQ worker queue backlog

**Resolution:** Scaled worker instances and optimized job processing

**Status:** ✅ Resolved

---

## Maintenance Windows

| Date | Time | Services | Impact |
|------|------|----------|--------|
| June 1, 2026 | 02:00 - 04:00 IST | Database migration | Brief downtime expected |
| June 15, 2026 | 03:00 - 05:00 IST | Redis upgrade | No downtime expected |

---

## Subscribe to Updates

Get notified of incidents and maintenance:

- **Email:** support@rez.money
- **Status Page:** [status.rez.money](https://status.rez.money)
- **Twitter:** [@REZPlatform](https://twitter.com/REZPlatform)

---

## SLA Guarantees

| Tier | Uptime SLA | Response Time |
|------|-----------|--------------|
| Free | 99.5% | 48 hours |
| Starter | 99.9% | 24 hours |
| Growth | 99.95% | 8 hours |
| Business | 99.99% | 4 hours |
| Enterprise | 99.999% | 1 hour |

---

## Report an Issue

If you're experiencing issues not reflected here:

- **Support:** support@rez.money
- **Emergency:** emergency@rez.money
- **Status Page:** [status.rez.money](https://status.rez.money)

---

**Last Updated:** May 28, 2026 10:30 AM IST
**Next Update:** Upon any status change

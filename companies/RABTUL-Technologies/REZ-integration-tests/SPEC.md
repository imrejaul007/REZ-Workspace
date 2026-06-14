# REZ Integration Tests - SPEC.md

**Version:** 1.0.0
**Company:** RABTUL-Technologies
**Category:** Testing

---

## Overview

Integration test suite for RABTUL-Technologies services. Validates cross-service communication and data flow.

---

## Test Coverage

| Service | Tests |
|---------|-------|
| Auth → Wallet | Token validation, balance checks |
| Order → Payment | Payment flow |
| Order → Catalog | Inventory sync |
| Notification → All | Delivery verification |

---

## Running Tests

```bash
npm test
```

---

## Status

- [x] Integration tests
- [x] Service communication
- [x] Data flow validation

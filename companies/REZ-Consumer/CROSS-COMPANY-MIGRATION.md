# Cross-Company Service Migration Guide

**Version:** 2.0.0
**Date:** June 5, 2026
**Status:** COMPLETED

---

## Overview

This document details the migration of services from REZ-Consumer to their correct company ownership. These services were incorrectly placed in REZ-Consumer but belong to other companies in the REZ ecosystem.

---

## Migration Summary

| Service | Current Location | Target Company | Target Location | Status |
|---------|----------------|----------------|-----------------|--------|
| buzzlocal | REZ-Consumer/ | **AXOM** | /Axom/buzzlocal/ | ✅ COMPLETE |
| airzy | REZ-Consumer/ | **KHAIRMOVE** | /KHAIRMOVE/airzy/ | ✅ COMPLETE |
| creator-qr | REZ-Consumer/ | **AdBazaar** | /AdBazaar/creators/ | ✅ COMPLETE |
| creator-qr-service | REZ-Consumer/ | **AdBazaar** | /AdBazaar/creators/ | ✅ COMPLETE |

---

## Migration Completion Details

### 1. BuzzLocal Migration - COMPLETED

**Completion Date:** June 5, 2026

| Item | Status | Details |
|------|--------|---------|
| Mobile App | ✅ Migrated | `/Axom/buzzlocal/mobile/` |
| Backend Services | ✅ Existing | `/Axom/buzzlocal/backend/` (9 microservices) |
| UPDATE-INSTRUCTIONS.md | ✅ Created | `/Axom/buzzlocal/UPDATE-INSTRUCTIONS.md` |
| MIGRATION-COMPLETE.md | ✅ Created | `/Axom/buzzlocal/MIGRATION-COMPLETE.md` |

### 2. Airzy Migration - COMPLETED

**Completion Date:** June 5, 2026

| Item | Status | Details |
|------|--------|---------|
| Full Ecosystem | ✅ Migrated | `/KHAIRMOVE/airzy/` (29 services) |
| Services | ✅ Included | airzy-api-gateway through airzy-dooh-extension |
| UPDATE-INSTRUCTIONS.md | ✅ Created | `/KHAIRMOVE/airzy/UPDATE-INSTRUCTIONS.md` |
| MIGRATION-COMPLETE.md | ✅ Created | `/KHAIRMOVE/airzy/MIGRATION-COMPLETE.md` |

### 3. Creator QR Migration - COMPLETED

**Completion Date:** June 5, 2026

| Item | Status | Details |
|------|--------|---------|
| creator-qr | ✅ Migrated | `/AdBazaar/creators/creator-qr/` |
| creator-qr-service | ✅ Migrated | `/AdBazaar/creators/creator-qr-service/` |
| UPDATE-INSTRUCTIONS.md | ✅ Created | `/AdBazaar/creators/creator-qr/UPDATE-INSTRUCTIONS.md` |
| MIGRATION-COMPLETE.md | ✅ Created | `/AdBazaar/creators/MIGRATION-COMPLETE.md` |

---

## Service Ownership Map (Updated)

### AXOM (Social + Entertainment)
- BuzzLocal mobile app: `/Axom/buzzlocal/mobile/`
- BuzzLocal backend: `/Axom/buzzlocal/backend/`
- Rendez: `/Axom/rendez/`

### KHAIRMOVE (Mobility + Airport)
- Airzy ecosystem: `/KHAIRMOVE/airzy/`
- Rides: `/KHAIRMOVE/rez-ride/`, `/KHAIRMOVE/khaimove-ride-service/`
- Delivery: `/KHAIRMOVE/khaimove-delivery-service/`

### AdBazaar (Marketing + DOOH)
- Creator QR: `/AdBazaar/creators/creator-qr/`
- Creator QR Service: `/AdBazaar/creators/creator-qr-service/`
- DOOH: `/AdBazaar/dooh/`

---

## Post-Migration Actions Required

### In REZ-Consumer

1. **Update CLAUDE.md** - Remove references to migrated services from ownership tables
2. **Search for imports** - Find and update any remaining references:

```bash
grep -r "buzzlocal" --include="*.ts" --include="*.tsx" REZ-Consumer/
grep -r "airzy" --include="*.ts" --include="*.tsx" REZ-Consumer/
grep -r "creator-qr" --include="*.ts" --include="*.tsx" REZ-Consumer/
```

3. **Remove legacy directories** - After verifying no dependencies remain:
   ```bash
   rm -rf /REZ-Consumer/buzzlocal/
   rm -rf /REZ-Consumer/airzy/
   rm -rf /REZ-Consumer/creator-qr/
   rm -rf /REZ-Consumer/creator-qr-service/
   rm -rf /REZ-Consumer/rez-creator-qr/
   ```

---

## Migration Documentation

Each destination now has the following documentation:

| Location | Documentation |
|----------|---------------|
| `/Axom/buzzlocal/UPDATE-INSTRUCTIONS.md` | How to sync changes, rollback instructions |
| `/Axom/buzzlocal/MIGRATION-COMPLETE.md` | Migration confirmation |
| `/KHAIRMOVE/airzy/UPDATE-INSTRUCTIONS.md` | How to sync changes, rollback instructions |
| `/KHAIRMOVE/airzy/MIGRATION-COMPLETE.md` | Migration confirmation |
| `/AdBazaar/creators/creator-qr/UPDATE-INSTRUCTIONS.md` | How to sync changes, rollback instructions |
| `/AdBazaar/creators/MIGRATION-COMPLETE.md` | Migration confirmation |

---

## Impact Summary

### REZ-Consumer (After Cleanup)

**Removed:**
- buzzlocal (social safety app - 69 screens)
- airzy (airport ecosystem - 29 services)
- creator-qr (creator QR - frontend + backend)
- rez-creator-qr (standalone)

**Retained:**
- rez-app (main super app)
- do (AI chat)
- verify-qr (warranty/QR verification)
- safe-qr-service (emergency services)
- go4food (food delivery)
- REZ-* stub services

### AXOM (After Migration)

**Gained:**
- BuzzLocal mobile app (React Native)
- Full BuzzLocal stack (mobile + 9 backend services)

### KHAIRMOVE (After Migration)

**Gained:**
- Airzy airport ecosystem (10 microservices + apps)

### AdBazaar (After Migration)

**Gained:**
- Creator QR frontend
- Creator QR service
- Standalone rez-creator-qr

---

## Rollback Plan

If migration causes issues, refer to the UPDATE-INSTRUCTIONS.md in each destination.

**Last Updated:** June 5, 2026
**Version:** 2.0.0
**Status:** COMPLETED

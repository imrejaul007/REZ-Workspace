# Airzy Migration - Update Instructions

**Date:** June 5, 2026
**Status:** MIGRATED from REZ-Consumer

---

## Migration Summary

This service was migrated from `/REZ-Consumer/airzy/` to `/KHAIRMOVE/airzy/`.

### Before Migration
- Source: `/Users/rejaulkarim/Documents/ReZ Full App/REZ-Consumer/airzy/`
- Company: REZ-Consumer (incorrect)

### After Migration
- Destination: `/Users/rejaulkarim/Documents/ReZ Full App/KHAIRMOVE/airzy/`
- Company: KHAIRMOVE (correct)

---

## Services Included

| Service | Port | Purpose |
|---------|------|---------|
| airzy-api-gateway | 4500 | Main API Gateway |
| airzy-flight-service | 4501 | Amadeus integration |
| airzy-lounge-service | 4502 | DreamFolks + Priority Pass |
| airzy-itinerary-service | 4503 | Trip management |
| airzy-wallet-extension | 4504 | Membership tiers + coins |
| airzy-ai-brain | 4505 | Travel intelligence |
| airzy-corp-service | 4506 | Corporate travel |
| airzy-hotel-extension | 4507 | Airport hotels |
| airzy-transfer-extension | 4508 | Airport transfers |
| airzy-dooh-extension | 4509 | Airport DOOH + attribution |
| airzy-intelligence | - | AI intelligence |
| apps/ | - | Mobile/Web apps |
| integrations/ | - | External API clients |
| shared/ | - | Shared types and clients |

---

## How to Sync Changes Between Locations

### If Working on REZ-Consumer/airzy (Legacy)

If you make changes to the source location at REZ-Consumer, sync them to KHAIRMOVE:

```bash
# Copy entire airzy directory
cp -r /REZ-Consumer/airzy/* /KHAIRMOVE/airzy/
```

### Recommended: Work Directly in KHAIRMOVE

For any new development, work directly in `/KHAIRMOVE/airzy/`:
- This is the canonical location
- REZ-Consumer/airzy is now deprecated

---

## Imports/References to Update in REZ-Consumer

### Files That May Reference airzy

Search for these patterns in REZ-Consumer:

```typescript
// OLD imports to update or remove
import { Something } from '../airzy';
import { Something } from './airzy';
import '@rez/airzy';
import 'airzy-*';
```

### Update to KHAIRMOVE References

```typescript
// NEW imports (if needed)
import { Something } from '@khaimove/airzy';
// or use direct service URLs
```

---

## Integration with KHAIRMOVE Ecosystem

Airzy integrates with these existing KHAIRMOVE services:

| Service | Integration Point |
|---------|------------------|
| khaimove-ride-service | Airport transfers |
| buzzlocal-rides-integration | Cross-platform rides |
| khaimove-api-gateway | Unified API |

---

## Rollback Instructions

If you need to restore from REZ-Consumer:

```bash
# Only if absolutely necessary
cp -r /REZ-Consumer/airzy/* /KHAIRMOVE/airzy/
```

---

## Contact

For questions about this migration, refer to:
- `/REZ-Consumer/CROSS-COMPANY-MIGRATION.md`
- `/KHAIRMOVE/CLAUDE.md`

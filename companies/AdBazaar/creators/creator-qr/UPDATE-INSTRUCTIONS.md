# Creator QR Migration - Update Instructions

**Date:** June 5, 2026
**Status:** MIGRATED from REZ-Consumer

---

## Migration Summary

These services were migrated from REZ-Consumer to AdBazaar:

| Source | Destination | Purpose |
|--------|-------------|---------|
| REZ-Consumer/creator-qr | AdBazaar/creators/creator-qr | Frontend app |
| REZ-Consumer/creator-qr-service | AdBazaar/creators/creator-qr-service | Backend service |
| REZ-Consumer/rez-creator-qr | AdBazaar/creators/rez-creator-qr | Standalone |

---

## Directory Structure

```
AdBazaar/creators/
├── adBazaar-creator/           # Existing AdBazaar creator tool
├── creator-commerce-service/   # Existing commerce service
├── REZ-creator-commerce/       # Existing commerce integration
├── creator-qr/                 # MIGRATED: Frontend app
├── creator-qr-service/         # MIGRATED: Backend service
└── rez-creator-qr/            # MIGRATED: Standalone
```

---

## How to Sync Changes Between Locations

### If Working on REZ-Consumer (Legacy)

If you make changes to the source location at REZ-Consumer, sync them:

```bash
# Sync creator-qr frontend
cp -r /REZ-Consumer/creator-qr/* /AdBazaar/creators/creator-qr/

# Sync creator-qr-service backend
cp -r /REZ-Consumer/creator-qr-service/* /AdBazaar/creators/creator-qr-service/

# Sync rez-creator-qr standalone
cp -r /REZ-Consumer/rez-creator-qr/* /AdBazaar/creators/rez-creator-qr/
```

### Recommended: Work Directly in AdBazaar

For any new development, work directly in AdBazaar:
- This is the canonical location
- REZ-Consumer locations are now deprecated

---

## Imports/References to Update in REZ-Consumer

Search for these patterns in REZ-Consumer:

```typescript
// OLD imports to update or remove
import { Something } from '../creator-qr';
import { Something } from './creator-qr';
import '@rez/creator-qr';
import 'creator-qr-service';
```

### Update to AdBazaar References

```typescript
// NEW imports (if needed)
import { Something } from '@adbazaar/creator-qr';
```

---

## Rollback Instructions

If you need to restore from REZ-Consumer:

```bash
# Only if absolutely necessary
cp -r /REZ-Consumer/creator-qr/* /AdBazaar/creators/creator-qr/
cp -r /REZ-Consumer/creator-qr-service/* /AdBazaar/creators/creator-qr-service/
```

---

## Contact

For questions about this migration, refer to:
- `/REZ-Consumer/CROSS-COMPANY-MIGRATION.md`
- `/AdBazaar/CLAUDE.md`

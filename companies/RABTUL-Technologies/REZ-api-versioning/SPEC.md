# REZ API Versioning - SPEC.md

**Version:** 1.0.0
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Express middleware for API versioning. Provides consistent versioning across all REZ services with support for header-based and URL-based versioning.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ API Versioning                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Strategies:                                                              │
│  ├── Header-based   → X-API-Version header                               │
│  ├── URL-based     → /v1/, /v2/ path prefixes                        │
│  └── Accept-header → Accept: application/vnd.rez.v1+json              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Usage

```typescript
import { apiVersioning, versionMiddleware } from '@rez/api-versioning';

app.use(apiVersioning({
  defaultVersion: 'v1',
  versions: ['v1', 'v2']
}));

app.use(versionMiddleware('v2', (req, res, next) => {
  // v2 specific logic
});
```

---

## Dependencies

```json
{
  "zod": "^3.22.0",
  "express": "^4.18.0"
}
```

---

## Status

- [x] Header-based versioning
- [x] URL-based versioning
- [x] Accept-header versioning
- [x] Version validation

# REZ Contracts - SPEC.md

**Version:** 1.0.0
**Company:** RABTUL-Technologies
**Category:** Shared

---

## Overview

Shared API schemas, types, and validation for the REZ ecosystem. Provides canonical Zod schemas used across all services for consistent data validation.

---

## Structure

```
src/
├── schemas/         # Domain schemas
├── types/          # TypeScript types
├── validation/     # Validation utilities
└── scripts/       # Schema validation scripts
```

---

## Available Schemas

### Commerce
- Order schemas
- Payment schemas
- Product schemas

### Auth
- User schemas
- Session schemas
- Token schemas

### Common
- Pagination
- Filters
- Date ranges

---

## Usage

```typescript
import { OrderSchema, UserSchema } from '@imrejaul007/rez-contracts';
import { z } from 'zod';

// Validate with schema
const validated = OrderSchema.parse(rawOrder);

// Type inference
type Order = z.infer<typeof OrderSchema>;
```

---

## Scripts

```bash
# Validate all schemas
npm run validate

# Bump version
npm run bump
```

---

## Dependencies

```json
{
  "zod": "^3.23.0"
}
```

---

## Status

- [x] Shared schemas
- [x] TypeScript types
- [x] Validation utilities
- [x] Schema versioning

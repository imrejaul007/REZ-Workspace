# rez-contracts

Centralized API schemas, types, and validation rules for the REZ ecosystem.

## Purpose

All services import shared contracts from here. This prevents API contract mismatches between services.

## Structure

```
rez-contracts/
  schemas/         # JSON Schema for API request/response
  types/           # TypeScript type definitions
  validation/      # Zod schemas for runtime validation
  scripts/         # Schema generators and validators
```

## Usage

### TypeScript Types

```bash
npm install @imrejaul007/rez-contracts
```

```typescript
import type { User, Transaction, CoinEntry } from '@imrejaul007/rez-contracts/types';

// Use in your service
const tx: Transaction = { ... };
```

### Validation

```typescript
import { validateTransaction, validateCoinEntry } from '@imrejaul007/rez-contracts/validation';

// Validate incoming data
const result = validateTransaction(incomingData);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

## Schema Registry

| Schema | Version | Services |
|--------|---------|----------|
| user.schema.json | 1.0.0 | auth, wallet, payment |
| transaction.schema.json | 1.0.0 | wallet, payment, order |
| coin.schema.json | 1.0.0 | wallet, gamification, karma |
| merchant.schema.json | 1.0.0 | merchant, catalog, order |
| order.schema.json | 1.0.0 | order, payment, merchant |

## Versioning

- Schemas are semantically versioned
- Breaking changes require a major version bump
- All services must pin to a schema version
- Use `npm outdated @imrejaul007/rez-contracts` to check for updates

## Publishing

```bash
npm version patch  # or minor or major
npm publish
```

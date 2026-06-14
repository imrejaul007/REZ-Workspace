# @rez/shared

Shared utilities, types, and utilities for REZ ecosystem.

## Install

```bash
npm install @rez/shared
```

## Usage

```typescript
import { 
  generateId, 
  UserSchema, 
  AppError, 
  createLogger 
} from '@rez/shared';

// Generate IDs
const userId = generateId('user');

// Validate data
const user = UserSchema.parse(data);

// Handle errors
try {
  // ...
} catch (error) {
  throw new AppError('VALIDATION_ERROR', 'Invalid data', 400);
}

// Logger
const logger = createLogger({ name: 'my-service' });
logger.info('Hello');
```

## Exports

### Types
- User, Entity, Pagination, Location, Money, Notification, AuditLog, FeatureFlag

### Errors
- AppError, NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError, RateLimitError, ServiceUnavailableError, InternalError

### Validation
- validate, safeParse, validators

### Utils
- uuid, shortId, sleep, retry, chunk, pick, omit, deepClone, groupBy, formatCurrency, mask, etc.

### Logger
- createLogger, logger, createChildLogger

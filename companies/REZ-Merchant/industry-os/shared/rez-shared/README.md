# REZ Shared Package

Common utilities for all REZ industry services.

## Installation

```bash
npm install @rez/shared
```

## Usage

```typescript
import {
  createAuthMiddleware,
  createDatabaseConnection,
  createLogger,
  createHealthCheck,
  createErrorHandler,
  createRateLimiter,
  createValidationMiddleware,
  standardizeResponse,
  standardizeError,
} from '@rez/shared';
```

## Features

### Auth Middleware
```typescript
import { createAuthMiddleware } from '@rez/shared';

const auth = createAuthMiddleware({
  authServiceUrl: process.env.AUTH_SERVICE_URL,
  internalToken: process.env.INTERNAL_SERVICE_TOKEN,
});

app.use('/api', auth);
```

### Database Connection
```typescript
import { createDatabaseConnection } from '@rez/shared';

const db = await createDatabaseConnection({
  mongoUrl: process.env.MONGO_URL,
  serviceName: 'my-service',
});

export default db;
```

### Logger
```typescript
import { createLogger } from '@rez/shared';

const logger = createLogger('my-service');
logger.info('Service started');
logger.error('Something went wrong', { error: err });
```

### Health Check
```typescript
import { createHealthCheck } from '@rez/shared';

app.get('/health', createHealthCheck('my-service', async () => ({
  database: await checkDb(),
  redis: await checkRedis(),
})));
```

### Standardized Responses
```typescript
import { standardizeResponse, standardizeError } from '@rez/shared';

// Success
res.json(standardizeResponse({ data: result }));

// Error
res.status(400).json(standardizeError('VALIDATION_ERROR', 'Invalid input'));
```

### Rate Limiter
```typescript
import { createRateLimiter } from '@rez/shared';

app.use(createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
}));
```

### Zod Validation Middleware
```typescript
import { createValidationMiddleware } from '@rez/shared';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
});

const validate = createValidationMiddleware(createUserSchema);

app.post('/api/users', validate, (req, res) => {
  // req.body is now validated and typed
  res.json(standardizeResponse({ user: req.body }));
});
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string |
| `AUTH_SERVICE_URL` | RABTUL Auth service URL |
| `INTERNAL_SERVICE_TOKEN` | Service-to-service auth token |
| `REDIS_URL` | Redis connection string |
| `LOG_LEVEL` | Logger level (info, warn, error) |
| `PORT` | Service port |

## Export Index

```typescript
// Core utilities
export { createAuthMiddleware } from './auth';
export { createDatabaseConnection } from './database';
export { createLogger } from './logger';
export { createHealthCheck } from './health';
export { createErrorHandler } from './error';
export { createRateLimiter } from './rateLimiter';
export { createValidationMiddleware } from './validation';
export { standardizeResponse, standardizeError } from './response';

// Types
export type { AuthOptions, AuthRequest } from './auth';
export type { DatabaseOptions } from './database';
export type { LoggerOptions } from './logger';
export type { HealthCheckOptions, HealthStatus } from './health';
export type { StandardResponse, StandardError } from './response';
```
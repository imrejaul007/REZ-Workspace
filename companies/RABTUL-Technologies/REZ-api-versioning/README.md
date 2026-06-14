# REZ API Versioning Middleware

A comprehensive, production-ready API versioning solution for the REZ ecosystem. Supports URL-based, header-based, and query-based versioning with automatic deprecation handling and graceful version transitions.

## Features

- **Multi-Strategy Versioning**
  - URL-based: `/api/v1/users`, `/api/v2/users`
  - Header-based: `Accept: application/vnd.rez.v1+json`
  - Custom header: `X-API-Version: v1.0.0`
  - Query-based: `?api_version=v1.0.0`

- **Deprecation Management**
  - Automatic deprecation warnings via standard HTTP headers
  - Sunset date enforcement with 410 Gone responses
  - Migration guidance and breaking change documentation
  - Upcoming sunset notifications

- **Breaking Change Detection**
  - Configurable breaking change definitions
  - Request/Response transformation support
  - Graceful version transition handling
  - Version compatibility checking

- **RFC Compliance**
  - RFC 7234 Deprecation header
  - RFC 8599 Sunset header
  - RFC 8288 Link header for API deprecation
  - Standard RFC 7231 date formatting

## Installation

```bash
npm install @rez/api-versioning
```

## Quick Start

```typescript
import express from 'express';
import {
  createApiVersioningMiddleware,
  registerVersion,
  createVersionedRouter,
  createVersionManagementRoutes,
  getServices,
} from '@rez/api-versioning';

const app = express();

// Register API versions
registerVersion({
  version: 'v1.0.0',
  isActive: true,
  breakingChanges: [],
});

registerVersion({
  version: 'v2.0.0',
  isActive: true,
  deprecationDate: new Date('2025-06-01'),
  sunsetDate: new Date('2025-12-01'),
  breakingChanges: [
    {
      type: 'changed_response_schema',
      description: 'User object restructured with new fields',
      migrationGuide: 'Update your code to handle the new user object structure',
    },
  ],
});

// Apply versioning middleware
app.use(createApiVersioningMiddleware({
  defaultVersion: 'v1.0.0',
  includeDeprecationHeaders: true,
}));

// Create versioned routers
const v1 = createVersionedRouter('v1.0.0');
v1.get('/users', (req, res) => {
  res.json({ users: [] });
});

const v2 = createVersionedRouter('v2.0.0');
v2.get('/users', (req, res) => {
  res.json({ data: [], meta: { total: 0 } });
});

// Mount version management endpoints
const { registry, deprecationManager } = getServices();
const mgmtRoutes = createVersionManagementRoutes(registry, deprecationManager);
mgmtRoutes.forEach(route => {
  app.use('/api', (req, res, next) => {
    if (req.path === route.path) {
      route.handler(req, res, next);
    } else {
      next();
    }
  });
});

app.listen(3000);
```

## Versioning Strategies

### URL-Based Versioning

The most common approach, using the URL path:

```typescript
// Request: GET /api/v1/users
// Request: GET /api/v2/users

app.use(createApiVersioningMiddleware({
  urlPrefix: '/api/v',
}));
```

### Header-Based Versioning

Using the Accept header with custom media type:

```typescript
// Request: GET /users
// Header: Accept: application/vnd.rez.v1+json

// Request: GET /users
// Header: Accept: application/vnd.rez.v2+json
```

### Custom Header Versioning

```typescript
// Request: GET /users
// Header: X-API-Version: v1.0.0

app.use(createApiVersioningMiddleware({
  headerName: 'X-API-Version',
}));
```

## API Reference

### Middleware Functions

#### `createApiVersioningMiddleware(options)`

Creates the versioning middleware for Express.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultVersion` | `string` | `'v1.0.0'` | Default API version |
| `headerName` | `string` | `'X-API-Version'` | Custom header for version |
| `urlPrefix` | `string` | `'/api/v'` | URL prefix for version extraction |
| `validateVersions` | `boolean` | `true` | Validate version exists |
| `includeDeprecationHeaders` | `boolean` | `true` | Add deprecation headers |
| `fallbackVersion` | `string` | `'v1.0.0'` | Fallback version on error |

#### `registerVersion(config)`

Register a new API version.

```typescript
registerVersion({
  version: 'v2.0.0',
  isActive: true,
  deprecationDate: new Date('2025-06-01'),
  sunsetDate: new Date('2025-12-01'),
  breakingChanges: [
    {
      type: 'changed_response_schema',
      description: 'User object restructured',
      migrationGuide: 'See migration guide at /docs/v2-migration',
    },
  ],
});
```

#### `createVersionedRouter(version)`

Create a router for a specific version.

```typescript
const v2 = createVersionedRouter('v2.0.0');

v2.get('/users', (req, res) => {
  res.json({ data: [] });
});

v2.post('/users', validateUserSchema, createUserHandler);
```

#### `requireVersion(minimumVersion)`

Middleware to require a minimum API version.

```typescript
app.get('/orders', requireVersion('v2.0.0'), (req, res) => {
  // Only accessible with v2.0.0+
});
```

### Management Endpoints

#### GET `/api/versions`

List all supported API versions.

**Response:**

```json
{
  "defaultVersion": "v1.0.0",
  "latestVersion": "v2.0.0",
  "supportedVersions": ["v1.0.0", "v2.0.0"],
  "versions": [
    {
      "version": "v1.0.0",
      "status": "supported",
      "sunsetDate": "2026-06-01T00:00:00.000Z",
      "breakingChangesCount": 0
    },
    {
      "version": "v2.0.0",
      "status": "current",
      "breakingChangesCount": 2
    }
  ]
}
```

#### GET `/api/deprecations`

List active deprecations.

**Response:**

```json
{
  "activeDeprecations": [
    {
      "version": "v1.0.0",
      "sunsetDate": "2026-06-01T00:00:00.000Z",
      "deprecationDate": "2025-06-01T00:00:00.000Z",
      "level": "deprecated",
      "message": "Version v1.0.0 is deprecated",
      "alternativeVersion": "v2.0.0",
      "breakingChanges": []
    }
  ],
  "upcomingSunset": [
    {
      "version": "v1.0.0",
      "sunsetDate": "2026-06-01T00:00:00.000Z",
      "daysRemaining": 45
    }
  ]
}
```

### Deprecation Headers

When a deprecated version is accessed, the following headers are added:

```
Deprecation: Sat, 01 Jun 2025 00:00:00 GMT
Sunset: Mon, 01 Jun 2026 00:00:00 GMT
Link: </api/v2>; rel="successor-version"; title="Suggested replacement version"
X-API-Version: v1.0.0
```

## Request Flow

```
Client Request
     │
     ▼
┌─────────────────────────┐
│  Version Extraction     │
│  (URL, Header, Query)   │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Version Validation     │
│  (Exists? Active?)      │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Deprecation Check     │
│  (Warning? Sunset?)     │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Route Matching         │
│  (Find Handler)         │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Response Transform     │
│  (If Needed)            │
└─────────────────────────┘
     │
     ▼
   Handler
```

## Breaking Change Types

| Type | Description |
|------|-------------|
| `removed_endpoint` | Endpoint no longer exists |
| `changed_response_schema` | Response structure modified |
| `changed_request_schema` | Request body format changed |
| `changed_behavior` | Same request/response, different outcome |
| `removed_parameter` | Query/path parameter removed |
| `changed_parameter_type` | Parameter type changed |
| `changed_authentication` | Auth requirements modified |
| `rate_limit_change` | Rate limits adjusted |

## Best Practices

### 1. Semantic Versioning

Use semantic versioning for API versions:

- `v1.0.0` - Initial release
- `v1.1.0` - New features, backward compatible
- `v2.0.0` - Breaking changes
- `v2.1.0` - New features, backward compatible

### 2. Sunset Policy

Set appropriate sunset dates:

```typescript
// Give users 6-12 months to migrate
registerVersion({
  version: 'v1.0.0',
  sunsetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
});
```

### 3. Deprecation Communication

Use deprecation dates and messages:

```typescript
registerVersion({
  version: 'v2.0.0',
  deprecationDate: new Date('2025-06-01'),
  sunsetDate: new Date('2025-12-01'),
  breakingChanges: [
    {
      type: 'changed_response_schema',
      description: 'User object restructured',
      migrationGuide: 'See https://docs.rez.app/v2-migration',
    },
  ],
});
```

### 4. Version Prioritization

The middleware checks versions in this order:

1. URL path (`/api/v1/users`)
2. Accept header (`application/vnd.rez.v1+json`)
3. Custom header (`X-API-Version: v1`)
4. Query parameter (`?api_version=v1`)
5. Default version

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import type {
  ApiVersion,
  VersionConfig,
  BreakingChange,
  DeprecationInfo,
  VersionedRequest,
  ApiVersioningOptions,
} from '@rez/api-versioning';
```

## License

MIT

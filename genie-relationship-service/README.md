# GENIE Relationship Service

**Personal Intelligence OS - Personal Relationship Tracking**

> "You don't use Genie. You talk to Genie."

## Overview

GENIE Relationship Service tracks personal relationships (family, friends, colleagues, clients, professionals) and their interactions for the GENIE Personal Intelligence OS.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Configuration

```bash
# Environment Variables
PORT=4702                              # Service port
MONGODB_URI=mongodb://localhost:27017/genie-relationships  # MongoDB connection
NODE_ENV=development                   # Environment
CORS_ORIGINS=*                         # CORS origins (comma-separated)
```

## API Endpoints

### Relationships

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/relationships` | Create a new relationship |
| GET | `/api/relationships` | List relationships (paginated) |
| GET | `/api/relationships/stats` | Get relationship statistics |
| GET | `/api/relationships/:id` | Get a single relationship |
| PUT | `/api/relationships/:id` | Update a relationship |
| DELETE | `/api/relationships/:id` | Delete a relationship |

### Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/relationships/:id/interactions` | Log a new interaction |
| GET | `/api/relationships/:id/interactions` | Get interactions (paginated) |
| GET | `/api/relationships/:id/interactions/stats` | Get interaction statistics |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/live` | Liveness probe (Kubernetes) |
| GET | `/health/ready` | Readiness probe (Kubernetes) |

## Request Headers

```bash
X-Tenant-Id: <tenant_id>    # Required - Tenant identifier
X-User-Id: <user_id>       # Required - User identifier
```

## API Examples

### Create Relationship

```bash
curl -X POST http://localhost:4702/api/relationships \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: tenant_001" \
  -H "X-User-Id: user_001" \
  -d '{
    "name": "John Doe",
    "relationship_type": "friend",
    "importance_score": 8,
    "tags": ["college", "mentor"],
    "notes": "Met at the conference",
    "birthday": "1990-05-15"
  }'
```

### List Relationships

```bash
curl http://localhost:4702/api/relationships \
  -H "X-Tenant-Id: tenant_001" \
  -H "X-User-Id: user_001" \
  "?page=1&pageSize=20&type=friend&sortBy=importance_score&sortOrder=desc"
```

### Log Interaction

```bash
curl -X POST http://localhost:4702/api/relationships/:id/interactions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: tenant_001" \
  -H "X-User-Id: user_001" \
  -d '{
    "type": "call",
    "description": "Discussed project collaboration"
  }'
```

## Relationship Types

| Type | Description |
|------|-------------|
| `family` | Family members |
| `friend` | Friends |
| `colleague` | Work colleagues |
| `client` | Business clients |
| `professional` | Professional contacts |

## Interaction Types

| Type | Description |
|------|-------------|
| `call` | Phone/video calls |
| `message` | Text messages |
| `meeting` | In-person meetings |
| `email` | Email exchanges |
| `note` | Personal notes |

## Security

- **Helmet** - Security headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - 100 requests/minute global, 30 writes/minute
- **Zod Validation** - All inputs validated
- **Tenant Isolation** - Multi-tenant support with header-based context

## Architecture

```
src/
├── index.ts           # Main entry point, Express server
├── types.ts           # TypeScript types and Zod schemas
├── middleware/
│   └── tenant.ts      # Tenant context extraction
├── models/
│   └── index.ts       # MongoDB schemas (Relationship, Interaction)
├── routes/
│   └── relationshipRoutes.ts  # API route handlers
├── services/
│   └── relationshipService.ts # Business logic
└── utils/
    └── logger.ts      # Structured JSON logging
```

## Port Registry

| Service | Port | Purpose |
|---------|------|---------|
| genie-relationship-service | **4702** | Personal relationship tracking |

## Version

1.0.0 - Initial Release (May 30, 2026)

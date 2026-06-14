# REZ Policy Engine

A comprehensive policy validation, override, and compliance service for the REZ platform.

## Features

- **Policy Validation**: Validate actions against configurable policies with conditions
- **Policy Override**: Temporarily override policy enforcement with audit trail
- **Compliance Checking**: Automated compliance verification and reporting
- **Multiple Policy Types**: Access Control, Data Governance, Compliance, Security, Business Rules

## API Endpoints

### Policy Validation
```bash
POST /api/policies/validate
{
  "resource": "user-data",
  "action": "read",
  "subject": "user-123",
  "context": { "role": "admin" }
}
```

### Policy Override
```bash
POST /api/policies/override
{
  "policyId": "uuid",
  "level": "ADMIN",
  "reason": "Emergency access required",
  "userId": "admin-123",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Compliance Report
```bash
GET /api/policies/compliance
GET /api/policies/compliance/:policyId
```

### Policy CRUD
```bash
GET    /api/policies
GET    /api/policies/:id
POST   /api/policies
PUT    /api/policies/:id
DELETE /api/policies/:id
```

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start server
npm start

# Development mode
npm run dev
```

## Health Check
```bash
GET /health
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |
| LOG_LEVEL | info | Logging level |
| CORS_ORIGIN | * | CORS allowed origin |

## Deployment

### Render
The service deploys automatically via `render.yaml` on push to main.

### Docker
```bash
docker build -t rez-policy-engine .
docker run -p 3000:3000 rez-policy-engine
```

## License

MIT

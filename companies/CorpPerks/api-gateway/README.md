# CorpPerks API Gateway

A production-ready unified API Gateway for CorpPerks microservices.

## Features

- **Request Routing**: Intelligent routing to 20+ microservices
- **Authentication**: JWT + API Key + Internal Service Token support
- **Rate Limiting**: Redis-backed distributed rate limiting with per-route config
- **Security**: Helmet security headers, CORS, timing-safe token comparison
- **Logging**: Structured Winston logging with request tracking
- **Health Checks**: Service health monitoring with detailed status
- **Metrics**: Request metrics and performance tracking
- **Error Handling**: Comprehensive error handling with proper status codes

## Quick Start

```bash
# Install dependencies
cd CorpPerks/api-gateway
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Routes

| Path | Target | Rate Limit | Description |
|------|--------|------------|-------------|
| `/api/employees` | localhost:4006 | 100/min | Employee management |
| `/api/attendance` | localhost:4006 | 200/min | Attendance tracking |
| `/api/payroll` | localhost:4738 | 50/min | Payroll processing |
| `/api/performance` | localhost:4729 | 100/min | Performance reviews |
| `/api/1on1` | localhost:4728 | 100/min | 1-on-1 meetings |
| `/api/okr` | localhost:4730 | 100/min | OKR tracking |
| `/api/workflow` | localhost:4731 | 50/min | Workflow automation |
| `/api/onboarding` | localhost:4732 | 100/min | Employee onboarding |
| `/api/exit` | localhost:4733 | 50/min | Exit interviews |
| `/api/lms` | localhost:4734 | 100/min | Learning management |
| `/api/reports` | localhost:4735 | 30/min | Reporting & analytics |
| `/api/calendar` | localhost:4736 | 100/min | Calendar & scheduling |
| `/api/sso` | localhost:4737 | 50/min | SSO integration |
| `/api/shifts` | localhost:4739 | 100/min | Shift management |
| `/api/compensation` | localhost:4740 | 50/min | Compensation planning |
| `/api/documents` | localhost:4741 | 100/min | Document management |
| `/api/video` | localhost:4742 | 100/min | Video conferencing |
| `/api/crm` | localhost:4725 | 100/min | CRM integration |
| `/api/corpid` | localhost:4701 | 100/min | Corporate ID |
| `/api/projects` | localhost:4715 | 100/min | Project management |
| `/api/team` | localhost:4716 | 100/min | Team management |

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/api/health` | Detailed health with service status |
| GET | `/api/health/detailed` | Full health report |
| GET | `/ready` | Kubernetes readiness probe |
| GET | `/metrics` | Request metrics |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/refresh` | Refresh JWT token |

## Authentication

The gateway supports multiple authentication methods:

1. **JWT Bearer Token** (recommended for users)
   ```
   Authorization: Bearer <token>
   ```

2. **API Key** (for service accounts)
   ```
   X-API-Key: <encrypted-api-key>
   ```

3. **Internal Service Token** (for service-to-service)
   ```
   X-Internal-Token: <service-token>
   ```

## Rate Limiting

Rate limits are applied per-route:
- Configurable via route definitions
- Redis-backed for distributed deployments
- Falls back to in-memory for single-instance
- Returns `429 Too Many Requests` when exceeded

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 4700 | Server port |
| `NODE_ENV` | No | development | Environment |
| `JWT_SECRET` | Yes (prod) | - | JWT signing secret |
| `INTERNAL_SERVICE_TOKEN` | Yes (prod) | - | Service-to-service auth |
| `REDIS_URL` | No | - | Redis for rate limiting |
| `RATE_LIMIT_WINDOW_MS` | No | 60000 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |

## Project Structure

```
api-gateway/
├── src/
│   ├── index.ts          # Main gateway entry
│   ├── routes.ts         # Route configuration
│   ├── types/
│   │   └── index.ts      # TypeScript types
│   ├── middleware/
│   │   ├── auth.ts       # Authentication
│   │   ├── rateLimit.ts  # Rate limiting
│   │   └── proxy.ts      # Proxy setup
│   └── utils/
│       └── logger.ts     # Winston logger
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- Helmet.js security headers
- CORS configuration
- Timing-safe token comparison
- Company isolation middleware
- Role-based access control (RBAC)
- Permission-based access control (PBAC)
- Request ID tracking
- Security event logging

## License

Proprietary - CorpPerks

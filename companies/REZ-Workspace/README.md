# REZ Workspace

**The AI-native operating system for businesses**

---

## Version: 1.0.0 | Production Ready ✅

### Production Features
- 🐳 **Docker & Docker Compose** - Full containerization with health checks
- 🔒 **Security Middleware** - Helmet, rate limiting, CORS, audit logging
- 📊 **Prometheus Metrics** - Built-in monitoring and observability
- 🧪 **Test Suite** - Jest unit tests with CI/CD pipeline
- 🔄 **Graceful Shutdown** - Proper signal handling and cleanup
- ✅ **Request Validation** - Zod schemas for all endpoints
- 📝 **MongoDB Ready** - Production schemas with indexes

---

## Overview

REZ Workspace is RTNM Digital's comprehensive productivity platform providing:
- **Workspace Management** - Team spaces, channels, and organization
- **Real-time Collaboration** - Messages, documents, and WebSocket support
- **Meeting Orchestration** - Scheduling with AI-powered notes
- **Document Intelligence** - AI analysis and semantic search
- **Task Management** - Projects with SUTAR Goal integration
- **Workflow Automation** - Trigger-based automation with HOJAI AI
- **Authentication** - JWT-based auth with RABTUL integration
- **CorpPerks Integration** - Full HRMS integration

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for containerized deployment)
- MongoDB 7.0+ (optional, auto-starts with Docker)
- Redis 7.0+ (optional, auto-starts with Docker)

### Option 1: Docker (Recommended for Production)

```bash
# Clone and navigate
cd REZ-Workspace

# Copy and configure environment
cp .env.example .env
# Edit .env with your production values

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f rez-workspace
```

### Option 2: Local Development

```bash
# Navigate to REZ-Workspace directory
cd REZ-Workspace

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Option 3: Docker Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

---

## Production Deployment

### Using Docker Compose

```bash
# Production deployment
docker-compose --env-file .env.production up -d

# Scale if needed
docker-compose up -d --scale rez-workspace=3
```

### Manual Deployment

```bash
# Build
npm run build

# Run
NODE_ENV=production PORT=4300 npm start
```

### Kubernetes (Helm)

```bash
# Add helm repo
helm repo add rez-workspace https://charts.rtnm.digital

# Install
helm install rez-workspace/rez-workspace \
  --set image.tag=latest \
  --set mongodb.uri=mongodb://mongo:27017 \
  --set redis.url=redis://redis:6379
```

---

## Environment Variables

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Service port | `4300` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-secret-here` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://...` |
| `REDIS_URL` | Redis connection string | `redis://...` |
| `INTERNAL_SERVICE_TOKEN` | Inter-service auth token | `your-token` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level |
| `CORS_ORIGIN` | `*` | Allowed origins |
| `ENABLE_RATE_LIMIT` | `true` | Enable rate limiting |
| `ENABLE_METRICS` | `true` | Enable Prometheus metrics |

---

## API Endpoints

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health |
| `GET` | `/health/ready` | Readiness check |
| `GET` | `/health/metrics` | JSON metrics |
| `GET` | `/metrics` | Prometheus metrics |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/logout` | User logout |
| `POST` | `/api/auth/refresh` | Refresh token |
| `GET` | `/api/auth/me` | Get current user |
| `PUT` | `/api/auth/me` | Update profile |
| `PATCH` | `/api/auth/me/status` | Update status |
| `POST` | `/api/auth/change-password` | Change password |

### Workspace

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workspaces` | Create workspace |
| `GET` | `/api/workspaces` | List user workspaces |
| `GET` | `/api/workspaces/:id` | Get workspace details |
| `PATCH` | `/api/workspaces/:id` | Update workspace |
| `DELETE` | `/api/workspaces/:id` | Delete workspace |
| `POST` | `/api/workspaces/:id/members` | Add member |
| `DELETE` | `/api/workspaces/:id/members/:userId` | Remove member |
| `GET` | `/api/workspaces/:id/analytics` | Workspace analytics |

### Channels & Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workspaces/:id/channels` | Create channel |
| `GET` | `/api/workspaces/:id/channels` | List channels |
| `GET` | `/api/channels/:id` | Get channel details |
| `GET` | `/api/channels/:id/messages` | Get messages |
| `POST` | `/api/channels/:id/messages` | Send message |
| `POST` | `/api/messages/:id/reactions` | Add reaction |

### Meetings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/meetings` | Schedule meeting |
| `GET` | `/api/meetings` | List meetings |
| `GET` | `/api/meetings/:id` | Get meeting details |
| `PATCH` | `/api/meetings/:id` | Update meeting |
| `POST` | `/api/meetings/:id/start` | Start meeting |
| `POST` | `/api/meetings/:id/end` | End meeting |
| `POST` | `/api/meetings/:id/notes/generate` | AI notes |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents` | Create document |
| `GET` | `/api/documents` | List documents |
| `GET` | `/api/documents/:id` | Get document |
| `PATCH` | `/api/documents/:id` | Update document |
| `GET` | `/api/documents/search` | Search documents |
| `POST` | `/api/documents/:id/analyze` | AI analysis |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks` | Create task |
| `GET` | `/api/tasks` | List tasks |
| `GET` | `/api/tasks/:id` | Get task |
| `PATCH` | `/api/tasks/:id` | Update task |
| `POST` | `/api/tasks/:id/comments` | Add comment |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workflows` | Create workflow |
| `GET` | `/api/workflows` | List workflows |
| `GET` | `/api/workflows/:id` | Get workflow |
| `PATCH` | `/api/workflows/:id/toggle` | Toggle active |
| `POST` | `/api/workflows/:id/trigger` | Trigger workflow |
| `GET` | `/api/workflows/:id/runs` | Get runs |

### AI Assistant

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/assistant` | Chat with AI |
| `GET` | `/api/ai/briefing` | Daily briefing |

### Collaboration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `WS` | `/ws` | WebSocket endpoint |
| `GET` | `/api/collaboration/sessions` | Active sessions |

---

## WebSocket Events

Real-time collaboration via WebSocket:

| Event | Direction | Description |
|-------|-----------|-------------|
| `authenticate` | → | Authenticate connection |
| `subscribe` | → | Subscribe to channel |
| `new_message` | ← | New message received |
| `message_updated` | ← | Message edited |
| `message_deleted` | ← | Message deleted |
| `reaction_added` | ← | Reaction added |
| `cursor_update` | ↔ | Cursor position |
| `user_typing` | ← | User typing indicator |
| `presence_update` | ← | User status changed |

---

## Directory Structure

```
REZ-Workspace/
├── src/
│   ├── index.ts              # Main entry point
│   ├── hub-client.ts         # Service integrations
│   ├── config/
│   │   ├── database.ts      # MongoDB + Redis
│   │   └── shutdown.ts      # Graceful shutdown
│   ├── models/
│   │   └── index.ts         # Mongoose schemas
│   ├── routes/
│   │   ├── auth.ts          # Authentication
│   │   └── workflow.ts     # Workflow automation
│   └── middleware/
│       ├── security.ts      # Helmet, rate-limit
│       ├── validation.ts    # Zod schemas
│       └── monitoring.ts    # Metrics
├── tests/
│   ├── setup.ts            # Test configuration
│   └── unit/               # Unit tests
├── docker/
│   ├��─ mongodb/            # MongoDB init
│   └── nginx/              # Nginx config
├── .github/
│   └── workflows/          # CI/CD pipelines
├── Dockerfile              # Production image
├── Dockerfile.dev         # Development image
├── docker-compose.yml     # Production compose
├── docker-compose.dev.yml # Development compose
├── jest.config.js         # Test configuration
├── package.json
└── tsconfig.json
```

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/auth.test.ts

# Run in watch mode
npm test -- --watch
```

---

## Monitoring

### Prometheus Metrics

```bash
# Get metrics
curl http://localhost:4300/metrics

# Key metrics:
# - rez_workspace_requests_total
# - rez_workspace_request_duration_ms
# - rez_workspace_active_connections
# - rez_workspace_ws_connections
# - rez_workspace_cache_hits_total
```

### Health Checks

```bash
# Basic health
curl http://localhost:4300/health

# Readiness (includes DB check)
curl http://localhost:4300/health/ready

# JSON metrics
curl http://localhost:4300/health/metrics
```

---

## Security

### Rate Limiting

- API: 100 requests/15 minutes
- Auth: 10 attempts/15 minutes
- Login: 5 attempts/hour
- Search: 30 requests/minute

### Security Headers

- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

### Audit Logging

Security-sensitive operations are logged with:
- Request ID
- User ID
- IP address
- Timestamp
- Action
- Status code

---

## Demo Users

| Email | Password | Name |
|-------|----------|------|
| `alice@rtnm.digital` | `demo123` | Alice Chen |
| `bob@rtnm.digital` | `demo123` | Bob Smith |
| `carol@rtnm.digital` | `demo123` | Carol Davis |

---

## Service Integrations

### HOJAI AI (4500-4560)
- Gateway, Memory, Intelligence, Agents, Workflows

### Genie (4703-4706)
- Memory, Briefing

### SUTAR OS (4142-4242)
- TwinOS, Goal

### CorpPerks (4700-4744)
- Gateway, Backend, Payroll, Shift, Performance, OKR, Meeting, LMS, Onboarding, Analytics

---

## License

Proprietary - RTNM Digital

---

Built with ❤️ by RTNM Digital - "Where teams work smarter, together"

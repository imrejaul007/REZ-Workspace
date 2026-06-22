# REZ Workspace

> **Tagline:** "The AI-native operating system for businesses"
> **Positioning:** "AI-Native Work & Productivity Platform"

---

## Company Overview

**Purpose:** Work & Productivity Platform enabling:
- Team collaboration and workspace management
- Real-time messaging and channels
- Meeting orchestration with AI notes
- Document intelligence and management
- Task and project management
- Workflow automation
- CorpPerks HRMS integration

### Core Modules (10)

| Module | Description |
|--------|-------------|
| **Workspace Management** | Team spaces, organizations, member management, permissions, branding |
| **Real-time Collaboration** | Messages, channels, threads, reactions, pinned messages |
| **Meeting Orchestration** | Scheduling, AI notes, transcripts, recurring meetings, calendar |
| **Document Intelligence** | AI analysis, semantic search, versioning, collaborative editing |
| **Task Management** | Projects, SUTAR Goals, assignment, subtasks, time tracking |
| **Workflow Automation** | Triggers, actions, templates, HOJAI AI integration |
| **AI Assistant** | Chat, daily briefing, context-aware responses |
| **Authentication & Security** | JWT, RABTUL, rate limiting, helmet, CORS |
| **CorpPerks Integration** | HRMS, payroll, performance, OKR, LMS, onboarding |
| **Production Infrastructure** | Docker, MongoDB, Redis, Prometheus, graceful shutdown |

---

## Architecture

```
REZ-Workspace/
├── src/
│   ├── index.ts              # Main entry (Port 4300)
│   ├── hub-client.ts         # Service integrations
│   ├── config/
│   │   ├── database.ts     # MongoDB + Redis
│   │   └── shutdown.ts      # Graceful shutdown
│   ├── models/
│   │   └── index.ts        # Mongoose schemas
│   ├── routes/
│   │   ├── auth.ts         # Authentication
│   │   └── workflow.ts     # Workflow automation
│   └── middleware/
│       ├── security.ts      # Helmet, rate-limit
│       ├── validation.ts    # Zod schemas
│       └── monitoring.ts    # Prometheus metrics
├── tests/                    # Jest tests
├── docker/                   # Docker configs
└── .github/workflows/        # CI/CD
```

---

## Components

### 1. Backend API (src/index.ts)

| Attribute | Value |
|-----------|-------|
| **Port** | 4300 |
| **Tech Stack** | Node.js 20+, Express 4.18, TypeScript 5.2 |
| **Database** | MongoDB 8.0 (Mongoose) |
| **Cache** | Redis 4.6 |
| **WebSocket** | ws 8.14 |
| **Auth** | JWT, bcryptjs |

#### Service Catalog

| Service | Purpose |
|---------|---------|
| Workspace Service | Team spaces management |
| Channel Service | Messaging channels |
| Meeting Service | Scheduling, AI notes |
| Document Service | Document management |
| Task Service | Task/project tracking |
| Workflow Service | Automation engine |
| AI Service | Assistant, briefing |
| Collaboration Service | Real-time sync |

#### API Endpoints

| Category | Endpoints |
|----------|-----------|
| Auth | `/api/auth/register`, `/login`, `/logout`, `/refresh`, `/me` |
| Workspaces | `/api/workspaces` (CRUD, members, analytics) |
| Channels | `/api/channels`, `/api/channels/:id/messages` |
| Meetings | `/api/meetings` (CRUD, start, end, notes/generate) |
| Documents | `/api/documents` (CRUD, search, analyze) |
| Tasks | `/api/tasks` (CRUD, comments) |
| Projects | `/api/projects` |
| Calendar | `/api/calendar` |
| AI | `/api/ai/assistant`, `/api/ai/briefing` |
| Workflows | `/api/workflows` (CRUD, trigger, runs) |
| Collaboration | `/api/collaboration/sessions` |
| Health | `/health`, `/health/ready`, `/health/metrics` |

### 2. WebSocket Server

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `/ws` |
| **Protocol** | WebSocket (ws) |
| **Events** | Real-time messaging, cursors, presence |

#### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `authenticate` | → | Authenticate connection |
| `subscribe` | → | Subscribe to channel |
| `new_message` | ← | New message |
| `message_updated` | ← | Message edited |
| `message_deleted` | ← | Message deleted |
| `reaction_added` | ← | Reaction |
| `cursor_update` | ↔ | Cursor position |
| `user_typing` | ← | Typing indicator |
| `presence_update` | ← | Status change |

### 3. Production Infrastructure

| Component | Status |
|-----------|-------|
| **Docker** | ✅ Dockerfile, docker-compose.yml |
| **MongoDB** | ✅ With indexes |
| **Redis** | ✅ With connection pooling |
| **Security** | ✅ Helmet, rate-limit, CORS |
| **Validation** | ✅ Zod schemas |
| **Testing** | ✅ Jest + supertest |
| **Monitoring** | ✅ Prometheus metrics |
| **Graceful Shutdown** | ✅ Signal handling |
| **CI/CD** | ✅ GitHub Actions |
| **ESLint** | ✅ .eslintrc.json |

---

## Integration Architecture

### HOJAI Services

| Service | Port | Purpose |
|---------|------|---------|
| Gateway | 4500 | Main gateway |
| Memory | 4520 | Semantic memory |
| Intelligence | 4530 | ML insights |
| Agents | 4550 | AI agents |
| Workflows | 4560 | Automation |

### External Services

| Service | Purpose |
|---------|---------|
| **RABTUL Auth** | User authentication |
| **RABTUL Wallet** | Coin storage |
| **SUTAR TwinOS** | Digital twins |
| **SUTAR Goal** | Goal tracking |
| **CorpPerks** | HRMS integration |
| **Genie** | Personal AI |

### Internal Flow

```
Client Request → Auth Middleware → Rate Limiter → Route Handler
                                                      ↓
                                              Business Logic
                                                      ↓
                              MongoDB ←→ Redis (Cache) ←→ External Services
```

---

## Security

### Implemented

- ✅ JWT authentication with refresh tokens
- ✅ Helmet security headers
- ✅ express-rate-limit (API: 100/15min, Auth: 10/15min)
- ✅ CORS with configurable origins
- ✅ Zod request validation
- ✅ Password hashing (bcryptjs)
- ✅ Audit logging for security events
- ✅ Request ID tracking
- ✅ Graceful shutdown handling
- ✅ MongoDB indexes for query optimization
- ✅ Redis connection pooling

---

## Brand Identity

| Element | Value |
|---------|-------|
| **Primary Color** | `#6366F1` Indigo |
| **Secondary Color** | `#8B5CF6` Violet |
| **Tagline** | "Where teams work smarter, together" |

---

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production
npm start

# Tests
npm test

# Docker
docker-compose up -d

# Docker build
docker build -t rez-workspace:latest .
```

---

## Environment Variables

```env
NODE_ENV=production
PORT=4300
MONGODB_URI=mongodb://localhost:27017/rez-workspace
REDIS_URL=redis://localhost:6379
JWT_SECRET=<min-32-chars>
INTERNAL_SERVICE_TOKEN=<secret>
RABTUL_AUTH_URL=https://rez-auth-service.onrender.com
UNIFIED_HUB_URL=http://localhost:4600
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

---

## Demo Users

| Email | Password | Name |
|-------|----------|------|
| alice@rtnm.digital | demo123 | Alice Chen |
| bob@rtnm.digital | demo123 | Bob Smith |
| carol@rtnm.digital | demo123 | Carol Davis |

---

## Directory Structure

```
REZ-Workspace/
├── CLAUDE.md                    # This file
├── README.md                    # Main documentation
├── SPEC.md                     # Technical specification
├── FEATURES-LIST.md             # Quick reference
├── RTNM-COMPANIES-AUDIT.md     # Company audit
├── RTNM-PRODUCTS-FEATURES-AUDIT.md  # Features audit
├── AUDIT-REPORT.md             # Internal audit
├── Dockerfile                   # Production image
├── Dockerfile.dev              # Development image
├── docker-compose.yml          # Production stack
├── docker-compose.dev.yml      # Development stack
├── src/
│   ├── index.ts               # Main entry point
│   ├── hub-client.ts          # Service integrations
│   ├── config/
│   │   ├── database.ts       # MongoDB + Redis config
│   │   └── shutdown.ts      # Graceful shutdown
│   ├── models/
│   │   └── index.ts          # Mongoose schemas (10 models)
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   └── workflow.ts       # Workflow routes
│   └── middleware/
│       ├── security.ts        # Helmet, rate-limit, CORS
│       ├── validation.ts     # Zod schemas
│       └── monitoring.ts      # Prometheus metrics
├── tests/
│   ├── setup.ts              # Test configuration
│   └── unit/                 # Unit tests
├── docker/
│   ├── nginx/
│   │   └── nginx.conf       # Reverse proxy config
│   └── mongodb/
│       └── init.js           # MongoDB initialization
├── .github/
│   └── workflows/
│       ├── ci-cd.yml         # CI/CD pipeline
│       └── pr-checks.yml     # PR checks
├── jest.config.js             # Test configuration
├── .eslintrc.json            # ESLint config
├── .dockerignore             # Docker ignore
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies
```

---

## Last Updated

**June 12, 2026**

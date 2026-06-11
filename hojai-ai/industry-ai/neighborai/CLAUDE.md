# NEIGHBORAI - Developer Guide

## Project Context

NEIGHBORAI is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered residential society operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Residential Society
**Port:** 4806

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `PRODUCT.md` | Product overview and requirements |
| `API.md` | Complete API documentation |
| `src/index.ts` | Main Express server |
| `src/config.ts` | Configuration and constants |
| `src/types/index.ts` | TypeScript type definitions |

## Architecture

```
neighborai/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration
│   ├── types/
│   │   └── index.ts          # Type definitions
│   ├── models/
│   │   └── index.ts          # MongoDB models (6 models)
│   ├── routes/
│   │   ├── residents.ts      # Resident management
│   │   ├── visitors.ts       # Visitor management
│   │   ├── complaints.ts # Complaint tracking
│   │   ├── maintenance.ts    # Maintenance billing
│   │   ├── events.ts         # Event management
│   │   ├── analytics.ts      # Analytics dashboard
│   │   ├── auth.ts          # Authentication
│   │   └── ai.ts            # AI employee routes
│   ├── services/
│   │   └── ai-employees.ts  # AI employee services
│   ├── middleware/
│   │   ├── auth.ts          # JWT authentication
│   │   └── logger.ts        # Winston logger
│   └── utils/
│       └── validators.ts    # Zod validation schemas
├── logs/                      # Log files
├── .env                       # Environment config
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── README.md
├── SOT.md
├── API.md
└── CLAUDE.md
```

## AI Employees

1. **Society Manager AI** - General management, queries, billing
2. **Visitor Manager AI** - Visitor management, security
3. **Complaint Resolver AI** - Issue resolution, escalation
4. **Community Agent AI** - Community events, bookings

## MongoDB Models

| Model | Purpose |
|-------|---------|
| Resident | Residential unit management |
| Visitor | Visitor tracking and check-in/out |
| Complaint | Issue tracking and resolution |
| Maintenance | Billing and payment tracking |
| Event | Community event management |
| User | Authentication and authorization |

## Port

**Main Service:** 4806

## Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Start production
npm start

# Health check
curl http://localhost:4806/health
```

## Environment Variables

```bash
PORT=4806
MONGODB_URI=mongodb://localhost:27017/neighborai
JWT_SECRET=your-secret-key
NODE_ENV=development
CORS_ORIGIN=*
LOG_LEVEL=info
INTERNAL_SERVICE_TOKEN=hojai-dev-token
WEBHOOK_SERVICE_URL=http://localhost:4090
HOJAI_URL=http://localhost:4800
NOTIFICATION_SERVICE_URL=http://localhost:4095
```

## API Base URL

```
http://localhost:4806
```

## HOJAI Integration

All Industry AI products connect to:
- **HOJAI Core** (port 4800) - Intent Graph, Memory, Trust
- **Webhook Service** (port 4090) - Event publishing
- **Notification Service** (port 4095) - SMS/WhatsApp

## Development Notes

- Use TypeScript for all new files
- Follow Express.js patterns from HOJAI Core
- Integrate with HOJAI Core for AI capabilities
- Add proper error handling and validation
- Include health check endpoints
- Use Zod for input validation
- Use Winston for logging

## Status

- [x] SOT.md created
- [x] Product folder structure created
- [x] src/index.ts - Main server
- [x] src/config.ts - Configuration
- [x] src/types/index.ts - Type definitions
- [x] src/models/index.ts - MongoDB models
- [x] src/routes/ - All API routes
- [x] src/services/ai-employees.ts - AI services
- [x] src/middleware/ - Auth and logger
- [x] src/utils/validators.ts - Zod schemas
- [x] README.md - Documentation
- [x] API.md - API documentation
- [x] CLAUDE.md - Developer guide

## Default Credentials

After starting the server:

```bash
curl -X POST http://localhost:4806/api/auth/seed
```

Default admin:
- Email: `admin@neighborai.com`
- Password: `admin123`

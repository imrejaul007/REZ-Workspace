# Franchise AI - Franchise Management AI Operating System

> "AI-Powered Franchise Operations"

**Version:** 1.0.0 | **Port:** 4058 | **Company:** HOJAI-AI

Franchise AI is a comprehensive AI operating system for franchise management. It combines franchisee tracking, performance monitoring, standards management, and revenue analytics to help franchisors manage their franchise network effectively.

## Features

### AI Employees

| AI Employee | Description | Capabilities |
|------------|-------------|---------------|
| **Performance Analyzer** | Franchise performance analysis | Revenue tracking, profit calculation, rating trends |
| **Standards Manager** | Brand standards compliance | Standard creation, category management, tracking |
| **Revenue Tracker** | Financial monitoring | Revenue aggregation, profit analysis, top performers |

### Core Features

- **Franchise Management** - Franchisee registration, status tracking, location management
- **Performance Tracking** - Revenue, expenses, profit, customer counts, ratings
- **Standards Management** - Brand standards by category, compliance tracking
- **Analytics Dashboard** - Total franchises, active count, revenue summaries, top performers

### Data Models

| Model | Fields | Purpose |
|-------|--------|---------|
| Franchise | franchiseId, name, owner, location, type, status, revenue, openedAt | Franchisee records |
| Performance | performanceId, franchiseId, period, revenue, expenses, profit, customers, rating | Performance metrics |
| Standard | standardId, name, category, description, required | Brand standards |

### Franchise Status

| Status | Description |
|--------|-------------|
| active | Franchise is operating normally |
| suspended | Franchise is temporarily suspended |
| closed | Franchise has been closed |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB with Mongoose |
| Authentication | JWT |
| Validation | Zod |
| Security | Helmet, CORS, Rate Limiting, Compression |
| Logging | Winston, Morgan |
| Configuration | dotenv |

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

## Environment Variables

```bash
# Server
PORT=4058
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/franchise_ai

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Health Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check with MongoDB status |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate and get JWT token |

### Franchises
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/franchises` | List all franchises |
| POST | `/api/franchises` | Create new franchise |
| GET | `/api/franchises/:id` | Get franchise by ID |
| PUT | `/api/franchises/:id` | Update franchise |
| DELETE | `/api/franchises/:id` | Delete franchise |
| GET | `/api/franchises/:id/performance` | Get franchise performance history |

### Performances
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/performances` | List all performances |
| GET | `/api/performances?franchiseId=X` | Filter by franchise |
| POST | `/api/performances` | Record new performance |

### Standards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/standards` | List all standards |
| GET | `/api/standards?category=X` | Filter by category |
| POST | `/api/standards` | Create new standard |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get franchise statistics |

## API Examples

### Login
```bash
curl -X POST http://localhost:4058/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### Create Franchise
```bash
curl -X POST http://localhost:4058/api/franchises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Pizza Palace", "owner": "John Smith", "location": "New York", "type": "restaurant"}'
```

### Record Performance
```bash
curl -X POST http://localhost:4058/api/performances \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"franchiseId": "franchise-uuid", "period": "2024-Q1", "revenue": 50000, "expenses": 30000, "customers": 500, "rating": 4.5}'
```

## Architecture

```
franchise-ai/
├── src/
│   ├── index.ts          # Main entry point
│   ├── config.ts         # Configuration
│   ├── types/            # TypeScript types
│   ├── models/           # MongoDB schemas
│   ├── middleware/       # Auth, logging, error handling
│   ├── services/         # Business logic (AI employees)
│   └── routes/           # REST API endpoints
├── .env.example
├── package.json
└── tsconfig.json
```

## Documentation

- [API Documentation](API.md) - Complete API reference
- [State of Technology](SOT.md) - Technical specification
- [Developer Guide](CLAUDE.md) - Development documentation
- [Product Overview](PRODUCT.md) - Product requirements

## Pricing

| Plan | Price | Target |
|------|-------|--------|
| HOJAI AI | 4,999/month | Non-REZ clients |
| REZ-Merchant OS | Included | REZ ecosystem clients |

## Support

For technical support: **support@hojai.ai**

## License

Proprietary - HOJAI AI

---

**Company:** HOJAI-AI
**Category:** Industry AI
**Industry:** Franchise Management
**Status:** Production Ready
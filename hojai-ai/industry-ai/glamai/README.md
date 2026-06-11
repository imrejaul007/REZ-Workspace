# GLAMAI - Salon AI Operating System

> "Your Salon's AI Partner"

**Version:** 1.0.0 | **Port:** 4860 | **Company:** HOJAI-AI

GLAMAI is an AI-powered operating system for salons and spas. It combines 4 AI employees, automated scheduling, loyalty management, and comprehensive analytics to operate a salon's day-to-day operations.

## Features

### 4 AI Employees

| AI Employee | Description | Capabilities |
|------------|-------------|---------------|
| **Beauty Advisor** | Service recommendations | Hair/skin analysis, occasion-based recommendations, product matching |
| **Appointment Manager** | Scheduling & reminders | Booking, rescheduling, cancellations, slot availability, conflict resolution |
| **Campaign Agent** | Marketing & loyalty | Birthday campaigns, promotions, win-back, seasonal offers, referral programs |
| **Retention Agent** | Churn prevention | Risk scoring, re-engagement, loyalty upgrades, at-risk customer identification |

### Core Features

- **Customer Management** - Registration, loyalty tiers (Bronze/Silver/Gold/Platinum), visit tracking
- **Service Catalog** - Categories: Hair, Skin, Nails, Spa, Massage, Makeup
- **Appointment Scheduling** - Smart slot availability, stylist assignment, conflict detection
- **Stylist Management** - Specialties, ratings, availability
- **Analytics Dashboard** - Revenue, appointments, customer segments, stylist performance

### Loyalty Program

| Tier | Min. Spent | Discount | Benefits |
|------|------------|----------|----------|
| Bronze | 0 | 0% | Base rewards |
| Silver | 2,000 | 5% | Priority booking |
| Gold | 5,000 | 10% | Free add-ons |
| Platinum | 10,000 | 15% | VIP treatment |

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
PORT=4860
NODE_ENV=development

# MongoDB
MONGO_URL=mongodb://localhost:27017/glamai

# Authentication
JWT_SECRET=your-secret-key
INTERNAL_TOKEN=your-internal-token

# Ecosystem Services (optional)
HOJAI_URL=http://localhost:4800
AUTH_SERVICE_URL=http://localhost:4002
NOTIFICATION_SERVICE_URL=http://localhost:4095
```

## API Endpoints

### Health Checks
- `GET /health` - Full health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### AI Endpoints
- `POST /api/ai/beauty-advisor/recommend` - Get recommendations
- `POST /api/ai/appointment/schedule` - Book appointment
- `POST /api/ai/campaign/create` - Create campaign
- `POST /api/ai/retention/analyze` - Analyze retention risk

### CRUD Endpoints
- `POST/GET/PATCH/DELETE /api/customers` - Customer management
- `POST/GET/PATCH/DELETE /api/services` - Service management
- `POST/GET/PATCH /api/appointments` - Appointment management
- `POST/GET/PATCH/DELETE /api/stylists` - Stylist management

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/customers` - Customer analytics

## Service Categories

| Category | Example Services |
|----------|------------------|
| Hair | Haircut, Hair Coloring, Hair Styling |
| Skin | Facial, Cleansing |
| Nails | Manicure, Pedicure, Nail Art |
| Spa | Full Body Massage |
| Massage | Head Massage |
| Makeup | Bridal Makeup, Party Makeup |

## Architecture

```
glamai/
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
**Industry:** Salon & Spa
**Status:** Production Ready
# NEIGHBORAI - Residential Society AI Operating System

> *"AI for Smarter Communities"*

**Version:** 1.0.0
**Port:** 4806

A production-ready AI-powered residential society management system with intelligent agents for operations, visitor management, complaint tracking, and community events.

## AI Employees

| AI Employee | Description | Capabilities |
|-------------|-------------|--------------|
| **Society Manager AI** | Operations & Billing | General queries, billing info, resident directory |
| **Visitor Agent AI** | Visitor Management | Pre-approval, check-in/check-out, entry codes |
| **Complaint Agent AI** | Issue Tracking | Registration, tracking, SLA monitoring, escalation |
| **Community Agent AI** | Events & Announcements | Event planning, RSVP management, analytics |

## Features

- **AI-Powered Operations** - Intelligent agents handle queries and automate tasks
- **Visitor Management** - Pre-approval workflow with entry codes
- **Complaint Tracking** - SLA monitoring with automatic escalation
- **Maintenance Billing** - Automated monthly bill generation
- **Event Management** - Planning, RSVP tracking, announcements
- **Real-time Analytics** - Comprehensive dashboard with insights
- **JWT Authentication** - Secure token-based authentication
- **MongoDB Storage** - Persistent data with Mongoose ODM
- **Webhook Integration** - Event publishing to HOJAI ecosystem
- **Rate Limiting** - Protection against abuse
- **Winston Logging** - Comprehensive logging
- **Zod Validation** - Input validation

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file (optional, defaults work)
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build the image
docker build -t neighborai .
docker run -p 4806:4806 neighborai
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4806 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/neighborai |
| `JWT_SECRET` | JWT signing secret | (change in production) |
| `NODE_ENV` | Environment | development |
| `CORS_ORIGIN` | Allowed origins | * |
| `LOG_LEVEL` | Logging level | info |
| `INTERNAL_SERVICE_TOKEN` | Internal service token | hojai-dev-token |
| `WEBHOOK_SERVICE_URL` | Webhook service URL | http://localhost:4090 |
| `HOJAI_URL` | HOJAI Core URL | http://localhost:4800 |

## API Endpoints

### AI Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/status` | Get AI system status |
| `POST` | `/api/ai/society/query` | Society query |
| `POST` | `/api/ai/society/billing` | Billing info via AI |
| `POST` | `/api/ai/visitor/pre-approve` | Pre-approve visitor |
| `POST` | `/api/ai/visitor/checkin` | Check in visitor |
| `POST` | `/api/ai/visitor/checkout` | Check out visitor |
| `POST` | `/api/ai/complaint/track` | Track complaint |
| `POST` | `/api/ai/complaint/register` | Register complaint via AI |
| `GET` | `/api/ai/complaint/stats` | Get complaint statistics |
| `POST` | `/api/ai/event/plan` | Plan event via AI |
| `GET` | `/api/ai/event/upcoming` | Get upcoming events |
| `POST` | `/api/ai/converse` | Natural language conversation |

### Residents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/residents` | List all residents |
| `GET` | `/api/residents/:id` | Get resident by ID |
| `GET` | `/api/residents/flat/:flatNumber` | Get by flat number |
| `POST` | `/api/residents` | Create resident |
| `PATCH` | `/api/residents/:id` | Update resident |
| `DELETE` | `/api/residents/:id` | Delete resident |
| `POST` | `/api/residents/:id/vehicle` | Add vehicle |
| `POST` | `/api/residents/:id/family` | Add family member |

### Visitors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/visitors` | List visitors |
| `GET` | `/api/visitors/:id` | Get visitor by ID |
| `POST` | `/api/visitors/checkin` | Check in visitor |
| `POST` | `/api/visitors/checkout` | Check out visitor |
| `POST` | `/api/visitors/approve/:id` | Approve visitor |
| `POST` | `/api/visitors/deny/:id` | Deny visitor |

### Complaints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/complaints` | List complaints |
| `GET` | `/api/complaints/:id` | Get complaint by ID |
| `POST` | `/api/complaints` | Register complaint |
| `PATCH` | `/api/complaints/:id` | Update complaint |
| `POST` | `/api/complaints/:id/resolve` | Resolve complaint |
| `GET` | `/api/complaints/stats/summary` | Get statistics |

### Maintenance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/maintenance` | List all maintenance |
| `GET` | `/api/maintenance/:flatNumber` | Get by flat number |
| `POST` | `/api/maintenance/request` | Create request |
| `POST` | `/api/maintenance/generate` | Generate monthly bills |
| `POST` | `/api/maintenance/:id/pay` | Record payment |
| `POST` | `/api/maintenance/overdue/update` | Mark overdue bills |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | List events |
| `GET` | `/api/events/:id` | Get event by ID |
| `POST` | `/api/events` | Create event |
| `PATCH` | `/api/events/:id` | Update event |
| `POST` | `/api/events/:id/rsvp` | RSVP to event |
| `POST` | `/api/events/:id/announce` | Announce event |
| `DELETE` | `/api/events/:id` | Delete event |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/dashboard` | Dashboard data |
| `GET` | `/api/analytics/residents` | Resident analytics |
| `GET` | `/api/analytics/visitors` | Visitor analytics |
| `GET` | `/api/analytics/complaints` | Complaint analytics |
| `GET` | `/api/analytics/maintenance` | Maintenance analytics |
| `GET` | `/api/analytics/events` | Event analytics |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Get current user |
| `PATCH` | `/api/auth/password` | Change password |
| `POST` | `/api/auth/seed` | Seed admin user |

## Security

- **Helmet** - Security headers (CSP, XSS, etc.)
- **Rate Limiting** - 100 requests per 15 minutes
- **JWT Authentication** - Token-based auth with 7-day expiry
- **Input Validation** - Zod schemas for all inputs
- **CORS** - Cross-origin request handling
- **Password Hashing** - bcrypt with 12 rounds

## Health Checks

```bash
# Full health check with stats
curl http://localhost:4806/health

# Liveness probe (always returns 200)
curl http://localhost:4806/health/live

# Readiness probe (checks MongoDB)
curl http://localhost:4806/health/ready
```

## Default Credentials

After starting the server, seed the admin user:

```bash
curl -X POST http://localhost:4806/api/auth/seed
```

Default admin:
- Email: `admin@neighborai.com`
- Password: `admin123`

## Sample API Usage

### Login
```bash
curl -X POST http://localhost:4806/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@neighborai.com","password":"admin123"}'
```

### Create Resident
```bash
curl -X POST http://localhost:4806/api/residents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "flatNumber": "501",
    "wing": "A",
    "status": "owner"
  }'
```

### Register Visitor via AI
```bash
curl -X POST http://localhost:4806/api/ai/visitor/pre-approve \
  -H "Content-Type: application/json" \
  -d '{
    "flatNumber": "101",
    "visitorName": "Jane Smith",
    "phone": "9876543211",
    "purpose": "Family Visit"
  }'
```

### File Complaint
```bash
curl -X POST http://localhost:4806/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "residentId": "<resident_id>",
    "flatNumber": "101",
    "category": "maintenance",
    "description": "Water leakage in bathroom",
    "priority": "high"
  }'
```

### Track Complaint via AI
```bash
curl -X POST http://localhost:4806/api/ai/complaint/track \
  -H "Content-Type: application/json" \
  -d '{"complaintId": "<complaint_id>"}'
```

## Project Structure

```
neighborai/
├── src/
│   ├── index.ts              # Main server entry
│   ├── config.ts             # Configuration
│   ├── types/
│   │   └── index.ts          # Type definitions
│   ├── models/
│   │   └── index.ts          # MongoDB models
│   ├── routes/
│   │   ├── residents.ts      # Resident routes
│   │   ├── visitors.ts       # Visitor routes
│   │   ├── complaints.ts     # Complaint routes
│   │   ├── maintenance.ts    # Maintenance routes
│   │   ├── events.ts         # Event routes
│   │   ├── analytics.ts      # Analytics routes
│   │   ├── auth.ts           # Auth routes
│   │   └── ai.ts             # AI employee routes
│   ├── services/
│   │   └── ai-employees.ts   # AI employee services
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   └── logger.ts         # Winston logger
│   └── utils/
│       └── validators.ts     # Zod validation schemas
├── logs/                     # Log files
├── .env                      # Environment config
├── .env.example              # Environment template
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── README.md
├── CLAUDE.md
├── SOT.md
└── API.md
```

## Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Main documentation |
| `SOT.md` | State of Technology |
| `API.md` | API reference |
| `CLAUDE.md` | Developer guide |

## Port

- **Main Service:** 4806

## Support

For technical support, contact: support@hojai.ai

## License

Proprietary - HOJAI AI
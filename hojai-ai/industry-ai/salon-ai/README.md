# SALON-AI - Salon & Beauty Industry AI Operating System

> *"Your Salon's AI Partner"*

**Version:** 1.0.0
**Port:** 4870
**Company:** HOJAI-AI

SALON-AI is an AI-powered operating system for salons, spas, and beauty centers. It combines intelligent agents for style advice, appointment management, and customer retention.

## AI Employees

| AI Employee | Description | Capabilities |
|-------------|-------------|--------------|
| **AI Style Advisor** | Style Recommendations | Hair/skin analysis, occasion-based styling, product matching |
| **AI Booking Agent** | Scheduling | Appointment booking, rescheduling, availability checking |
| **AI Product Recommender** | Retail | Product suggestions based on services and preferences |

## Features

- **Customer Management** - Registration, loyalty tiers (Bronze/Silver/Gold/Platinum), visit tracking
- **Service Catalog** - Categories: Hair, Skin, Nails, Spa, Massage, Makeup
- **Appointment Scheduling** - Smart slot availability, stylist assignment, conflict detection
- **Stylist Management** - Specialties, ratings, availability tracking
- **AI Style Advisor** - Personalized recommendations based on face shape, hair type, occasion
- **AI Booking Agent** - Intelligent scheduling suggestions
- **Loyalty Program** - Multi-tier rewards with increasing benefits
- **Real-time Analytics** - Dashboard with revenue and customer insights
- **MongoDB Storage** - Persistent data with Mongoose ODM
- **Webhook Integration** - Event publishing to HOJAI ecosystem
- **Rate Limiting** - Protection against abuse
- **Winston Logging** - Comprehensive logging

## Loyalty Program

| Tier | Min. Spent | Discount | Benefits |
|------|------------|----------|----------|
| Bronze | 0 | 0% | Base rewards |
| Silver | 2,000 | 5% | Priority booking |
| Gold | 5,000 | 10% | Free add-ons |
| Platinum | 10,000 | 15% | VIP treatment |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4870 |
| `MONGO_URL` | MongoDB connection string | mongodb://localhost:27017/salon_ai |
| `NODE_ENV` | Environment | development |
| `CORS_ORIGIN` | Allowed origins | * |
| `LOG_LEVEL` | Logging level | info |
| `INTERNAL_SERVICE_TOKEN` | Internal service token | hojai-dev-token |

## API Endpoints

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Full health check with MongoDB status |
| `GET` | `/health/live` | Liveness probe (always returns 200) |
| `GET` | `/health/ready` | Readiness probe (checks MongoDB) |

### AI Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/status` | Get AI system status |
| `POST` | `/api/ai/style/advice` | Get style recommendations |
| `POST` | `/api/ai/booking/suggest` | Get booking suggestions |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/customers` | Register new customer |
| `GET` | `/api/customers` | List all customers |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/services` | List all services |
| `GET` | `/api/services?category=hair` | Filter by category |
| `POST` | `/api/services` | Create new service |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/appointments` | Book appointment |
| `GET` | `/api/appointments` | List appointments |
| `GET` | `/api/appointments?date=2026-01-01` | Filter by date |

### Stylists

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/stylists` | Add stylist |
| `GET` | `/api/stylists` | List stylists |

## Service Categories

| Category | Example Services |
|----------|------------------|
| Hair | Haircut, Hair Coloring, Hair Styling |
| Skin | Facial, Cleansing |
| Nails | Manicure, Pedicure, Nail Art |
| Spa | Full Body Massage |
| Massage | Head Massage |
| Makeup | Bridal Makeup, Party Makeup |

## Health Checks

```bash
# Full health check
curl http://localhost:4870/health

# Liveness probe
curl http://localhost:4870/health/live

# Readiness probe
curl http://localhost:4870/health/ready
```

## Sample API Usage

### Create Customer
```bash
curl -X POST http://localhost:4870/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "+919876543210",
    "email": "jane@example.com",
    "preferences": ["hair-coloring", "facials"]
  }'
```

### Get Style Advice
```bash
curl -X POST http://localhost:4870/api/ai/style/advice \
  -H "Content-Type: application/json" \
  -d '{
    "faceShape": "oval",
    "hairType": "wavy",
    "occasion": "wedding"
  }'
```

### Get Booking Suggestion
```bash
curl -X POST http://localhost:4870/api/ai/booking/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "haircut",
    "preferredDate": "2026-01-15"
  }'
```

### Book Appointment
```bash
curl -X POST http://localhost:4870/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-xxx",
    "serviceId": "SVC-xxx",
    "stylistId": "STY-xxx",
    "date": "2026-01-15",
    "time": "10:00"
  }'
```

## Project Structure

```
salon-ai/
├── src/
│   └── index.ts              # Main server entry
├── services/
│   ├── booking-service/      # Appointment booking microservice
│   ├── staff-scheduler/     # Staff scheduling microservice
│   └── inventory-service/   # Product inventory microservice
├── employees/
│   ├── beauty-advisor/      # AI Style Advisor
│   ├── appointment-manager/  # AI Booking Agent
│   ├── campaign-manager/     # Marketing Agent
│   └── retention-manager/   # Retention Agent
├── .env                      # Environment config
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Main documentation |
| `.env.example` | Environment template |
| `PRODUCT.md` | Product requirements |

## Port

- **Main Service:** 4870

## Support

For technical support, contact: support@hojai.ai

## License

Proprietary - HOJAI AI
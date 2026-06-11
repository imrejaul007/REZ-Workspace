# FITNESS-AI - Fitness & Gym Industry AI Operating System

> *"AI-Powered Fitness Management"*

**Version:** 1.0.0
**Port:** 4810
**Company:** HOJAI-AI

A production-ready AI-powered fitness and gym management system with intelligent agents for member management, class scheduling, and fitness recommendations.

## AI Employees

| AI Employee | Description | Capabilities |
|-------------|-------------|--------------|
| **AI Personal Trainer** | Workout Plans | Customized training plans based on fitness goals |
| **AI Nutrition Advisor** | Diet Plans | Personalized nutrition recommendations |
| **AI Class Scheduler** | Scheduling | Class booking and availability management |
| **Retention Manager** | Churn Prevention | Member retention and re-engagement |

## Features

- **Member Management** - Registration, membership plans, loyalty tracking
- **Class Management** - Fitness classes, instructor assignment, capacity management
- **Attendance Tracking** - Check-in/check-out, visit history, engagement metrics
- **AI Training Plans** - Personalized workout recommendations based on goals
- **AI Nutrition** - Calorie and macro recommendations based on weight goals
- **Real-time Analytics** - Dashboard with member insights and trends
- **MongoDB Storage** - Persistent data with Mongoose ODM
- **Webhook Integration** - Event publishing to HOJAI ecosystem
- **Rate Limiting** - Protection against abuse
- **Winston Logging** - Comprehensive logging

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
| `PORT` | Server port | 4810 |
| `MONGO_URL` | MongoDB connection string | mongodb://localhost:27017/fitness_ai |
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
| `POST` | `/api/ai/trainer/plan` | Generate workout plan |
| `POST` | `/api/ai/nutrition/plan` | Generate nutrition plan |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/members` | Register new member |
| `GET` | `/api/members` | List all members |
| `GET` | `/api/members?status=active` | Filter by status |

### Classes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/classes` | List all classes |
| `POST` | `/api/classes` | Create new class |
| `GET` | `/api/classes?type=yoga` | Filter by type |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/attendance/checkin` | Check in member |
| `GET` | `/api/attendance` | List attendance records |
| `GET` | `/api/attendance?memberId=xxx` | Filter by member |

## Health Checks

```bash
# Full health check
curl http://localhost:4810/health

# Liveness probe
curl http://localhost:4810/health/live

# Readiness probe
curl http://localhost:4810/health/ready
```

## Sample API Usage

### Create Member
```bash
curl -X POST http://localhost:4810/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "membershipPlan": "Premium",
    "fitnessGoals": ["weight-loss", "muscle-gain"]
  }'
```

### Get Workout Plan
```bash
curl -X POST http://localhost:4810/api/ai/trainer/plan \
  -H "Content-Type: application/json" \
  -d '{
    "fitnessGoals": "muscle-gain",
    "experience": "intermediate"
  }'
```

### Get Nutrition Plan
```bash
curl -X POST http://localhost:4810/api/ai/nutrition/plan \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "weight-loss",
    "weight": 80
  }'
```

### Check In Member
```bash
curl -X POST http://localhost:4810/api/attendance/checkin \
  -H "Content-Type: application/json" \
  -d '{"memberId": "FIT-xxx"}'
```

## Project Structure

```
fitness-ai/
├── src/
│   └── index.ts              # Main server entry
├── services/
│   ├── member-service/       # Member management microservice
│   ├── class-scheduler/      # Class scheduling microservice
│   ├── attendance-service/   # Attendance tracking microservice
│   └── membership-plan-service/  # Membership plans microservice
├── employees/
│   ├── fitness-coach/        # AI Personal Trainer
│   ├── nutrition-advisor/    # AI Nutrition Advisor
│   ├── retention-manager/    # Retention Agent
│   └── membership-advisor/   # Membership Advisor
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

## Port

- **Main Service:** 4810

## Support

For technical support, contact: support@hojai.ai

## License

Proprietary - HOJAI AI
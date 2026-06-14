# Health Campaigns Service

Healthcare engagement and monetization campaigns for AdBazaar.

## Service Purpose

Manages healthcare-specific advertising campaigns, patient engagement programs, pharmacy promotions, and health content monetization within regulatory compliance.

## Port

```
3023
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List health campaigns |
| POST | `/api/campaigns` | Create health campaign |
| GET | `/api/campaigns/:id` | Get campaign details |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| POST | `/api/campaigns/:id/approve` | Approve campaign |
| GET | `/api/compliance/:id` | Get compliance status |
| GET | `/api/providers` | List healthcare providers |
| POST | `/api/providers` | Register provider |
| GET | `/api/analytics` | Health campaign analytics |

## Configuration

Environment variables:

```env
PORT=3023
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/health-campaigns
HIPAA_MODE=true
```

## Compliance

- HIPAA compliant data handling
- FDA advertising guidelines
- Medical content review workflows

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Axios (HTTP client)
- Zod (validation)
- Winston (logging)
- UUID (ID generation)
- Dotenv (environment config)

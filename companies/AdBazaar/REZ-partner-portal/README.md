# REZ Partner Portal

Partner management portal for OEM, Telco, and Agency partners.

## Service Purpose

Self-service portal for partners to manage their advertising partnerships, view performance, access APIs, and manage billing. Supports multiple partner types: OEM, Telco, and Agency.

## Port

```
3008
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/partners` | List all partners |
| POST | `/api/partners` | Create new partner |
| GET | `/api/partners/:id` | Get partner details |
| PUT | `/api/partners/:id` | Update partner |
| DELETE | `/api/partners/:id` | Delete partner |
| GET | `/api/partners/:id/stats` | Partner performance stats |
| POST | `/api/partners/:id/invite` | Invite team member |
| GET | `/api/partners/:id/inventory` | Partner inventory access |
| POST | `/api/partners/:id/keys` | Generate API keys |
| GET | `/api/partners/:id/reports` | Partner reports |
| GET | `/api/partners/:id/billing` | Partner billing |

## Configuration

Environment variables:

```env
PORT=3008
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-partner-portal
REDIS_URL=redis://localhost:6379
API_GATEWAY_URL=http://localhost:3000
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start

# Run tests
npm test
```

## Partner Types

- **OEM**: Original Equipment Manufacturers with embedded devices
- **Telco**: Telecommunications partners with mobile/carrier integrations
- **Agency**: Advertising agencies managing multiple client campaigns

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Axios (HTTP client)
- Zod (validation)
- UUID (ID generation)
- CORS
- Helmet (security headers)
- Rate limiting

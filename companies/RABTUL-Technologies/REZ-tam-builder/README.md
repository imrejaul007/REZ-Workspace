# REZ TAM Builder

**Port: 4128**

B2B Account Universe Building Service - Build and manage Ideal Customer Profiles (ICPs) and account universes.

## Features

- **ICP Management**: Create, update, clone, and manage Ideal Customer Profiles
- **Account Universe Building**: Build target account lists from ICP definitions
- **Company Scoring**: Multi-dimensional scoring (industry, size, location, technology, behavior)
- **Contact Discovery**: Find contacts at target accounts
- **Contact Enrichment**: Get detailed contact information

## API Endpoints

### ICP Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/icp` | Create new ICP |
| GET | `/api/v1/icp` | List all ICPs |
| GET | `/api/v1/icp/:id` | Get ICP by ID |
| PUT | `/api/v1/icp/:id` | Update ICP |
| DELETE | `/api/v1/icp/:id` | Soft delete ICP |
| POST | `/api/v1/icp/:id/clone` | Clone ICP |

### Account Universe

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/universe` | Build universe from ICP |
| GET | `/api/v1/universe/:id` | Get universe status |
| GET | `/api/v1/universe/:id/accounts` | Get accounts in universe |
| POST | `/api/v1/universe/:id/refresh` | Refresh universe |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/contacts/discover` | Discover contacts |
| POST | `/api/v1/contacts/enrich` | Enrich contact data |
| GET | `/api/v1/contacts/roles` | Get available roles |
| GET | `/api/v1/contacts/departments` | Get available departments |

## ICP Structure

```json
{
  "name": "Enterprise SaaS Target",
  "firmographics": {
    "industries": ["Technology", "Financial Services"],
    "companySizes": ["201-500", "501-1000", "1001-5000"],
    "locations": {
      "countries": ["USA", "UK", "India"],
      "tiers": ["tier1"]
    },
    "revenueRange": { "min": 10000000, "max": 100000000 }
  },
  "technographics": {
    "technologies": ["Salesforce", "HubSpot"],
    "hasCRM": true
  },
  "behavioral": {
    "useCases": ["Sales Automation", "Analytics"],
    "buyingStage": ["consideration", "decision"]
  }
}
```

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

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4128 | Service port |
| MONGODB_URI | mongodb://localhost:27017/tam-builder | MongoDB connection |
| NODE_ENV | development | Environment |
| SERVICE_TOKEN | - | Internal service token |
| RATE_LIMIT_WINDOW_MS | 60000 | Rate limit window |
| RATE_LIMIT_MAX_REQUESTS | 100 | Max requests per window |

## Health Check

```bash
curl http://localhost:4128/health
```

## Related Services

- **REZ Signal Service** (Port 4129) - B2B intent signal detection
- **REZ Intelligence** (Ports 4100-4119) - AI/ML services

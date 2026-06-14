# NL Campaign Builder V2

Natural language to campaign pipeline - converts advertiser's intent ("I want to sell 1000 phones in Bangalore") into full campaign setup.

**Port:** 4822

## Features

- **NLP Parsing** - Converts natural language to structured campaign configuration
- **Automatic Campaign Generation** - Creates complete campaign with ads, targeting, and budget
- **Audience Targeting** - Extracts location, demographics, and interests from input
- **Budget Optimization** - Allocates budget across channels based on goal type
- **Channel Recommendation** - Suggests optimal channels (Google, Facebook, Instagram, etc.)
- **A/B Test Setup** - Configures A/B testing for campaign optimization
- **Confidence Scoring** - Provides confidence score for generated campaigns
- **Campaign Adjustment** - Allows tweaking campaigns based on feedback

## Tech Stack

- **Express** - Web framework
- **MongoDB** - Database for storing campaign builds
- **Redis** - Caching and session management
- **Zod** - Schema validation
- **JWT** - Authentication
- **Prometheus** - Metrics
- **OpenAI** - NLP parsing (with rule-based fallback)

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- Redis (optional)
- OpenAI API key (optional)

### Installation

```bash
cd nl-campaign-builder-v2
npm install
```

### Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=4822
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nl-campaign-builder
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Build Campaign

```http
POST /api/nl/build
Content-Type: application/json

{
  "naturalLanguage": "I want to sell 1000 phones in Bangalore with a budget of 50000 INR",
  "advertiserId": "advertiser-123",
  "context": {
    "industry": "electronics",
    "brandGuidelines": {
      "tone": "professional"
    }
  }
}
```

Response:
```json
{
  "success": true,
  "buildId": "uuid",
  "campaign": {
    "name": "Sell phones - Bangalore - 2024-01-15",
    "objective": "sales",
    "status": "draft",
    "budget": { "amount": 50000, "currency": "INR" },
    "targeting": {
      "locations": ["Bangalore"],
      "interests": ["electronics", "shopping"]
    },
    "ads": [...],
    "schedule": { "startDate": "...", "endDate": "..." },
    "bidStrategy": { "type": "cpa", "targetCost": 50 }
  },
  "confidence": 0.85,
  "suggestions": ["Add more ad variations for better performance"],
  "warnings": []
}
```

### Get Campaign

```http
GET /api/nl/campaigns/:id
Authorization: Bearer <token>
```

### Validate Campaign

```http
POST /api/nl/validate
Content-Type: application/json

{
  "campaign": { ... },
  "strict": false
}
```

### Adjust Campaign

```http
PUT /api/nl/campaigns/:id/adjust
Content-Type: application/json

{
  "feedback": "increase budget by 20%",
  "changes": { ... }
}
```

### Parse Natural Language

```http
POST /api/nl/parse
Content-Type: application/json

{
  "naturalLanguage": "I want to sell 1000 phones in Bangalore"
}
```

### Get Builds

```http
GET /api/nl/builds
Authorization: Bearer <token>
```

### Get Stats

```http
GET /api/nl/stats
Authorization: Bearer <token>
```

## Health Checks

```bash
# Health check
curl http://localhost:4822/health

# Readiness check
curl http://localhost:4822/ready

# Metrics
curl http://localhost:4822/metrics
```

## Campaign Schema

```typescript
interface NLCampaignBuild {
  buildId: string;
  advertiserId: string;
  naturalLanguage: string;
  parsed: {
    goal: {
      type: 'leads' | 'sales' | 'bookings' | 'traffic' | 'awareness';
      target: number;
      timeline?: string;
    };
    audience: {
      location: string[];
      demographics?: { age?: string; gender?: string };
      interests?: string[];
      income?: string;
    };
    budget: {
      amount: number;
      currency: string;
    };
    products?: { name: string; price?: number; category?: string }[];
    channels?: string[];
  };
  generatedCampaign: object;
  confidence: number;
  suggestions: string[];
  status: 'parsing' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
}
```

## Supported Goal Types

| Goal Type | Description | Recommended Channels |
|-----------|-------------|---------------------|
| `sales` | Convert to purchases | Google, Facebook, Instagram |
| `leads` | Generate inquiries | Google, Facebook, LinkedIn |
| `bookings` | Drive appointments | Google, Facebook |
| `traffic` | Increase visitors | Google, Display, Native |
| `awareness` | Brand visibility | Facebook, Instagram, YouTube, TikTok |

## Supported Channels

- Google (Search, Display, YouTube)
- Facebook
- Instagram
- YouTube
- LinkedIn
- Twitter
- TikTok
- Display
- Native

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/nlp-parser.test.ts

# Watch mode
npm run test:watch
```

## Project Structure

```
nl-campaign-builder-v2/
├── src/
│   ├── config/           # Configuration (database, redis, config)
│   ├── middleware/       # Express middleware (auth, metrics, validation)
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (NLP, campaign generation)
│   ├── types/           # TypeScript types and Zod schemas
│   ├── utils/           # Utilities (logger)
│   └── index.ts         # Application entry point
├── tests/               # Test files
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4822 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/nl-campaign-builder |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `JWT_SECRET` | JWT signing secret | (required) |
| `OPENAI_API_KEY` | OpenAI API key | (optional) |
| `OPENAI_MODEL` | OpenAI model | gpt-4-turbo-preview |
| `LOG_LEVEL` | Log level | info |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## License

MIT
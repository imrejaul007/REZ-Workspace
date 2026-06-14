# REZ Audience Marketplace

Audience segment marketplace for buying and selling audience data.

## Service Purpose

Marketplace for discovering, purchasing, and selling audience segments. Enables advertisers to target specific demographics, interests, and behaviors using third-party audience data.

## Port

```
3027
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/segments` | Browse available segments |
| GET | `/api/segments/:id` | Get segment details |
| GET | `/api/segments/search` | Search segments |
| POST | `/api/segments` | Create/ublish segment |
| PUT | `/api/segments/:id` | Update segment |
| DELETE | `/api/segments/:id` | Remove segment |
| GET | `/api/segments/:id/size` | Get segment size |
| POST | `/api/segments/:id/preview` | Preview segment |
| POST | `/api/purchase` | Purchase segment access |
| GET | `/api/purchases` | View purchases |
| GET | `/api/sales` | View segment sales |
| GET | `/api/analytics` | Marketplace analytics |

## Configuration

Environment variables:

```env
PORT=3027
NODE_ENV=development
MARKETPLACE_FEE_PERCENT=15
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
npm run test:run
npm run test:coverage
```

## Segment Categories

- Demographics (age, gender, income)
- Interests (sports, tech, fashion)
- Intent (auto, home, finance)
- Behavioral (frequent buyers, new parents)
- Location (city, zip, geo-fence)

## Pricing Model

| Pricing | Description |
|---------|-------------|
| CPM | Cost per 1000 impressions |
| Flat Fee | Fixed price per segment |
| Subscription | Monthly access fee |

## Tech Stack

- Express.js
- TypeScript
- Zod (validation)
- UUID (ID generation)
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Rate limiting
- Vitest (testing)

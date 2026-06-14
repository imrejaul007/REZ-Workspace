# REZ Birthday Rewards

Birthday reward campaigns and automated engagement service.

## Service Purpose

Manages birthday reward campaigns, automates reward delivery, tracks engagement metrics, and integrates with marketing automation for personalized birthday experiences.

## Port

```
3002
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rewards` | List all birthday rewards |
| POST | `/api/rewards` | Create new birthday reward |
| GET | `/api/rewards/:id` | Get reward details |
| PUT | `/api/rewards/:id` | Update reward |
| DELETE | `/api/rewards/:id` | Delete reward |
| POST | `/api/rewards/assign` | Assign reward to user |
| GET | `/api/rewards/user/:userId` | Get user's birthday rewards |
| POST | `/api/rewards/claim/:id` | Claim a birthday reward |

## Configuration

Environment variables:

```env
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-birthday-rewards
EXTERNAL_API_URL=https://api.example.com
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

## Tech Stack

- Express.js
- TypeScript
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Vitest (testing)

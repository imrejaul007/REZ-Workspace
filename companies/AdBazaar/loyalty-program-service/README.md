# Loyalty Program Service

Core loyalty program management for AdBazaar.

## Features

- Points-based and tiered loyalty programs
- Earn and redeem points
- Tier management
- Member enrollment tracking
- Points balance management

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/programs | Create program |
| GET | /api/programs | List programs |
| GET | /api/programs/:id | Get program |
| PUT | /api/programs/:id | Update program |
| POST | /api/programs/:id/enroll | Enroll user |
| POST | /api/programs/:id/earn | Earn points |
| POST | /api/programs/:id/redeem | Redeem points |
| GET | /api/programs/:id/enrollment/:userId | Get enrollment |
| GET | /api/programs/user/:userId | Get user enrollments |
| DELETE | /api/programs/:id | Archive program |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/loyalty-program-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5101 | Service port |
| MONGODB_URI | mongodb://localhost:27017/loyalty-program | MongoDB connection |
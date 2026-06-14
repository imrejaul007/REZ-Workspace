# Social Listener

Social media monitoring and listening service for tracking brand mentions, keywords, and sentiment.

## Features

- Monitor keywords across multiple platforms
- Track mentions and brand conversations
- Real-time sentiment analysis
- Alert system for important mentions
- Platform filtering and location tracking

## Quick Start

```bash
cd social-listener
npm install
npm run dev
```

## Environment Variables

```env
PORT=5052
MONGODB_URI=mongodb://localhost:27017/social-listener
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### Listening

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/listen/keywords | Add keyword to monitor |
| GET | /api/listen/keywords/list | List all keywords |
| GET | /api/listen/:keyword | Get mentions for keyword |
| GET | /api/listen | Get all mentions |
| PUT | /api/listen/keywords/:id | Update keyword |
| DELETE | /api/listen/keywords/:id | Delete keyword |

### Mentions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/mentions/stats | Get mention statistics |
| GET | /api/mentions/recent | Get recent mentions |
| POST | /api/mentions | Create mention (manual) |
| PUT | /api/mentions/:id/process | Mark as processed |

### Sentiment

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sentiment/trends | Get sentiment trends |
| GET | /api/sentiment/summary | Get sentiment summary |
| POST | /api/sentiment/analyze | Analyze text sentiment |

## Health Check

```bash
curl http://localhost:5052/health
```

## Metrics

```bash
curl http://localhost:5052/metrics
```
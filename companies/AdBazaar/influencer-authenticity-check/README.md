# Influencer Authenticity Check Service

Service for detecting fake followers and inauthentic activity in influencer profiles.

**Port:** 5111

## Features

- Follower quality analysis (ratio, growth pattern)
- Engagement rate analysis (likes/comments ratio)
- Historical pattern detection (sudden spikes)
- Audience authenticity score
- Bot detection (automated behavior)
- Purchased followers detection
- Suspicious activity flags
- Recommendations for vetting

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Start production
npm run build
npm start
```

## API Endpoints

### Check Endpoints

- `POST /api/check/profile` - Check influencer profile
- `GET /api/check/:id` - Get check results
- `POST /api/check/batch` - Batch check multiple influencers

### Report Endpoints

- `GET /api/report/:id` - Detailed report
- `POST /api/report/:id/export` - Export report (PDF, CSV)

### Influencer Endpoints

- `GET /api/influencers/:id/history` - Check history
- `GET /api/influencers/:id/trend` - Authenticity trend

### Alert Endpoints

- `GET /api/alerts` - Active alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert

### Analytics Endpoints

- `GET /api/analytics` - Overall analytics

### Health & Metrics

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Models

### InfluencerProfile
- platform, username, followers, following, posts
- authenticityScore, riskLevel, flags, lastChecked

### AuthenticityCheck
- influencerId, date, scores, breakdown, recommendations, status

### CheckHistory
- influencerId, checks, trend, alerts

## Environment Variables

See `.env.example` for configuration options.
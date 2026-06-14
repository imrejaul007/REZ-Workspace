# REZ Deal Intelligence

**Port: 4131**

CRM Pipeline Intelligence with AI Insights - Deal scoring, win probability, and recommendations.

## Features

- **AI Deal Scoring**: Multi-dimensional scoring (company fit, intent, engagement, activity, sentiment)
- **Win Probability Prediction**: Rule-based and ML-powered predictions
- **Smart Recommendations**: AI-generated next actions and insights
- **Risk Detection**: Automatic identification of deal risks
- **Temperature Classification**: Hot/Warm/Cold deal categorization
- **Pipeline Analytics**: Stage-by-stage analysis and forecasting

## Deal Scoring Dimensions

| Dimension | Weight | Source |
|-----------|--------|--------|
| Company Fit | 25% | TAM Builder |
| Intent Signals | 25% | Signal Service |
| Engagement | 20% | Outbound Service |
| Activity | 15% | CRM Activities |
| Sentiment | 15% | Conversation Intelligence |

## API Endpoints

### Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/deals` | Create deal |
| GET | `/api/v1/deals` | List deals |
| GET | `/api/v1/deals/priorities` | Get prioritized deals |
| GET | `/api/v1/deals/stats` | Get statistics |
| GET | `/api/v1/deals/:dealId` | Get deal |
| PATCH | `/api/v1/deals/:dealId` | Update deal |
| POST | `/api/v1/deals/:dealId/score` | Score deal |
| POST | `/api/v1/deals/:dealId/stage` | Move stage |
| POST | `/api/v1/deals/:dealId/close` | Close deal |

## Deal Stages

```
lead → qualified → proposal → negotiation → closed_won/closed_lost
```

## Temperature Thresholds

| Temperature | Score Range |
|------------|-------------|
| Hot | 75-100 |
| Warm | 50-74 |
| Cold | 0-49 |

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
| PORT | 4131 | Service port |
| MONGODB_URI | mongodb://localhost:27017/rez-deal-intelligence | MongoDB |
| NODE_ENV | development | Environment |

## Related Services

- **REZ TAM Builder** (Port 4128) - ICP & account universe
- **REZ Signal Service** (Port 4129) - Intent signals
- **REZ Outbound Service** (Port 4130) - Sequences
- **REZ Conversation Intelligence** (Port 4103) - NLP analysis

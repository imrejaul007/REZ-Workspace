# REZ Atlas v2 - AI Workforce, Engage & Intelligence Suite

**Version:** 2.0.0  
**Date:** June 9, 2026  
**Status:** ✅ 22 Services Built

## Overview

REZ Atlas v2 extends the original Atlas platform with AI-native workforce management, multi-channel customer engagement, and advanced business intelligence.

## Suite Architecture

```
REZ Atlas v2
├── AI Workforce Suite (6 services)
│   ├── atlas-workforce-core (5200)
│   ├── atlas-workforce-agent (5210)
│   ├── atlas-workforce-scheduler (5220)
│   ├── atlas-workforce-talent (5230)
│   ├── atlas-workforce-training (5235)
│   └── atlas-workforce-analytics (5240)
│
├── Customer Engagement Suite (5 services)
│   ├── atlas-engage-core (5250)
│   ├── atlas-engage-campaign (5260)
│   ├── atlas-engage-conversation (5270)
│   ├── atlas-engage-content (5280)
│   └── atlas-engage-automation (5290)
│
├── Intelligence Suite (9 services)
│   ├── atlas-intelligence-core (5300)
│   ├── atlas-intelligence-forecast (5310)
│   ├── atlas-intelligence-competitor (5320)
│   ├── atlas-intelligence-market (5330)
│   ├── atlas-intelligence-customer (5340)
│   ├── atlas-intelligence-pricing (5360)
│   ├── atlas-intelligence-signal (5370)
│   ├── atlas-intelligence-opportunity (5380)
│   ├── atlas-intelligence-assistant (5390)
│   └── atlas-intelligence-predictive (5395)
│
└── Revenue Operations (1 service)
    └── atlas-revenue-core (5350)
```

## AI Workforce Suite

### atlas-workforce-core (5200)
AI-native employee management platform.
- Employee profiles and skills
- Team management
- Performance tracking
- Skill gap analysis

### atlas-workforce-agent (5210)
Autonomous AI sales agents.
- Automated outreach
- Lead qualification
- Conversation handling
- Personalized messaging

### atlas-workforce-scheduler (5220)
AI-powered scheduling and routing.
- Route optimization
- Territory planning
- Calendar management
- Time allocation

### atlas-workforce-talent (5230)
Internal talent marketplace.
- Skill matching
- Gig opportunities
- Mentorship pairing
- Resource allocation

### atlas-workforce-training (5235)
Continuous learning platform.
- Course management
- Assessments
- Certification tracking
- AI-generated content

### atlas-workforce-analytics (5240)
Performance analytics.
- Leaderboards
- Productivity metrics
- Conversion tracking
- Trend analysis

## Customer Engagement Suite

### atlas-engage-core (5250)
Unified engagement hub.
- Campaign management
- Contact database
- Multi-channel orchestration
- Analytics dashboard

### atlas-engage-campaign (5260)
Multi-channel campaigns.
- WhatsApp campaigns
- Email campaigns
- SMS campaigns
- Push notifications
- A/B testing

### atlas-engage-conversation (5270)
Conversational messaging.
- WhatsApp Business API
- SMS gateway
- Email inbox
- Unified conversation view

### atlas-engage-content (5280)
AI content studio.
- Content generation
- Template library
- Personalization
- Brand guidelines

### atlas-engage-automation (5290)
Marketing automation.
- Visual workflow builder
- Trigger-based actions
- Drip campaigns
- Re-engagement flows

## Intelligence Suite

### atlas-intelligence-core (5300)
Central analytics hub.
- Real-time dashboards
- AI insights
- Natural language queries
- Predictive alerts

### atlas-intelligence-forecast (5310)
Revenue forecasting.
- ML predictions
- Trend analysis
- Scenario planning
- Confidence intervals

### atlas-intelligence-competitor (5320)
Competitor monitoring.
- Market share tracking
- Feature comparison
- Pricing analysis
- SWOT analysis

### atlas-intelligence-market (5330)
Market trend analysis.
- Industry trends
- Opportunity identification
- Demand forecasting
- Seasonal patterns

### atlas-intelligence-customer (5340)
360° customer profiles.
- Behavior analysis
- Segmentation
- Lifetime value
- Churn prediction

### atlas-intelligence-pricing (5360)
Dynamic pricing.
- Competitive pricing
- Demand-based pricing
- Promotional pricing
- Margin optimization

### atlas-intelligence-signal (5370)
Signal detection.
- Opportunity signals
- Risk signals
- Market signals
- Trend signals

### atlas-intelligence-opportunity (5380)
Lead scoring.
- ML-based scoring
- Intent detection
- Prioritization
- Pipeline intelligence

### atlas-intelligence-assistant (5390)
Conversational AI.
- Natural language queries
- Report generation
- Recommendations
- Action triggers

### atlas-intelligence-predictive (5395)
Predictive analytics.
- Churn prediction
- Revenue prediction
- Risk scoring
- Anomaly detection

## Revenue Operations

### atlas-revenue-core (5350)
Revenue operations hub.
- Pipeline management
- Deal tracking
- Revenue forecasting
- Commission tracking

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/REZ-Merchant/REZ-atlas-v2

# Start all services
./start.sh

# Or start individual services
cd atlas-workforce-core && npm install && npm run dev
cd atlas-engage-core && npm install && npm run dev
cd atlas-intelligence-core && npm install && npm run dev
```

## Health Checks

```bash
curl http://localhost:5200/health  # Workforce Core
curl http://localhost:5250/health  # Engage Core
curl http://localhost:5300/health  # Intelligence Core
curl http://localhost:5350/health  # Revenue Core
```

## API Examples

### Create Campaign
```bash
curl -X POST http://localhost:5250/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name": "Summer Sale", "channels": ["whatsapp", "sms"]}'
```

### Get AI Insights
```bash
curl http://localhost:5300/api/insights
```

### Score Lead
```bash
curl -X POST http://localhost:5380/api/score \
  -H "Content-Type: application/json" \
  -d '{"leadId": "lead-123", "features": {"visits": 5, "engagement": 80}}'
```

## Ecosystem Integration

| Service | Integrates With |
|---------|----------------|
| Workforce Core | RABTUL Auth, HOJAI AI |
| Engage Suite | RABTUL Notifications, WhatsApp |
| Intelligence | HOJAI Brain, REZ Mind |
| Revenue Core | RABTUL Wallet, RIDZA |

## Port Registry

| Port | Service |
|------|---------|
| 5200 | workforce-core |
| 5210 | workforce-agent |
| 5220 | workforce-scheduler |
| 5230 | workforce-talent |
| 5235 | workforce-training |
| 5240 | workforce-analytics |
| 5250 | engage-core |
| 5260 | engage-campaign |
| 5270 | engage-conversation |
| 5280 | engage-content |
| 5290 | engage-automation |
| 5300 | intelligence-core |
| 5310 | intelligence-forecast |
| 5320 | intelligence-competitor |
| 5330 | intelligence-market |
| 5340 | intelligence-customer |
| 5350 | revenue-core |
| 5360 | intelligence-pricing |
| 5370 | intelligence-signal |
| 5380 | intelligence-opportunity |
| 5390 | intelligence-assistant |
| 5395 | intelligence-predictive |

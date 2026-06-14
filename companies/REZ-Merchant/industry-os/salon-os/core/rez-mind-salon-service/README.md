# ReZ Salon Mind AI Service

AI-powered salon operations intelligence service for smart business decisions.

## Features

1. **Dynamic Pricing** - Real-time price optimization based on demand, time, and competitor analysis
2. **Service Recommendations** - Personalized suggestions based on hair type, history, and preferences
3. **Peak Hour Predictions** - Forecast busy periods for optimal scheduling
4. **Customer Churn Prediction** - Identify at-risk customers and implement retention strategies
5. **Stylist Productivity Analytics** - Track performance and identify improvement areas
6. **Seasonal Trend Analysis** - Understand business patterns throughout the year
7. **Competitor Pricing Analysis** - Stay competitive with market intelligence
8. **Upsell Suggestions** - Increase revenue with smart service pairing recommendations

## Getting Started

```bash
npm install
npm run build
npm start
```

## API Endpoints

### Pricing
- `POST /api/pricing/calculate` - Calculate dynamic price
- `POST /api/pricing/competitor` - Update competitor pricing
- `GET /api/pricing/recommendations` - Get price recommendations
- `GET /api/pricing/competitor/:serviceId` - Competitor analysis

### Insights
- `GET /api/insights/churn/:customerId` - Churn prediction
- `GET /api/insights/ltv/:customerId` - Customer lifetime value
- `GET /api/insights/stylist/:stylistId` - Stylist metrics
- `GET /api/insights/seasonal` - Seasonal trends
- `GET /api/insights/recommendations/:customerId` - Service recommendations

### Forecast
- `GET /api/forecast/peak-hours` - Peak hour predictions
- `GET /api/forecast/weekly` - Weekly forecast
- `GET /api/forecast/staffing` - Staffing recommendations

## Environment Variables

```bash
PORT=4010
LOG_LEVEL=info
MONGODB_URI=mongodb://localhost:27017/rez-salon
REDIS_URL=redis://localhost:6379
```

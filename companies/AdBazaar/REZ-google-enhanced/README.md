# REZ Google Enhanced

Google Enhanced Conversions integration for attribution.

## Service Purpose

Integrates with Google Enhanced Conversions API to send first-party conversion data securely. Improves conversion measurement accuracy and enables conversion modeling for privacy-preserving attribution.

## Port

```
3005
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversions/enhanced` | Submit enhanced conversion |
| POST | `/api/conversions/batch` | Submit batch conversions |
| GET | `/api/conversions/:id` | Get conversion status |
| GET | `/api/conversions` | List conversions |
| POST | `/api/conversions/validate` | Validate conversion data |

## Configuration

Environment variables:

```env
PORT=3005
NODE_ENV=development
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
MONGODB_URI=mongodb://localhost:27017/rez-google-enhanced
LOG_LEVEL=info
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
```

## Conversion Data Format

```typescript
interface EnhancedConversion {
  conversion_action: string;
  gclid_date_time_pair?: {
    gclid: string;
    conversion_date_time: string;
  };
  gclid?: string;
  conversion_date_time: string;
  conversion_value: number;
  currency_code?: string;
  order_id?: string;
  user_identifiers: {
    email?: string;
    phone_number?: string;
    address_info?: {
      street_address: string;
      city: string;
      region: string;
      postal_code: string;
      country_code: string;
    };
  };
}
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Axios (HTTP client)
- Winston (logging)
- CORS
- Helmet (security headers)
- Dotenv (environment config)

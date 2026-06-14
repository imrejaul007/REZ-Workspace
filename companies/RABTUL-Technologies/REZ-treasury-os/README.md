# TreasuryOS

**Cash Management, Investment Tracking, Forecast Optimization, FX Hedging, and Bank Statement Import**

TreasuryOS is a comprehensive treasury management service that provides businesses with real-time visibility into their cash positions, automated investment management, intelligent cash flow forecasting, currency risk management, and bank statement processing.

## Features

### 💰 Cash Management
- **Multi-Account Management**: Create and manage multiple treasury accounts (master, operating, reserve, escrow)
- **Cash Pooling**: Consolidate cash positions across multiple accounts
- **Automated Sweeps**: Configure rules to automatically sweep excess cash to investments or reserve accounts
- **Real-time Position**: Get instant consolidated cash position by currency and account type
- **Transaction Tracking**: Complete audit trail of all cash movements

### 📈 Investment Tracking
- **Multiple Investment Types**: Support for Fixed Deposits, Recurring Deposits, Mutual Funds, Government Bonds, Corporate Bonds, Money Market instruments
- **Mark-to-Market**: Track current value of investments with benchmark comparisons
- **Maturity Management**: Automatic processing of matured investments with auto-renewal options
- **Tax Tracking**: TDS calculation and tracking on interest earned
- **Return Analysis**: Calculate and track returns against benchmarks

### 🔮 Forecast Optimization
- **13-Week Rolling Forecast**: ML-based cash flow projection using historical patterns
- **Shortfall Prediction**: Early warning system for potential cash shortfalls
- **Recovery Actions**: Automated recommendations for addressing projected shortfalls
- **Variance Analysis**: Track forecast accuracy and learn from past predictions

### 🏦 Bank Statement Import
- **CSV Parsing**: Import bank statements from HDFC, ICICI, SBI, Axis, Yes Bank
- **Auto-Categorization**: Automatically categorize transactions (salary, transfer, payment, etc.)
- **Duplicate Detection**: Skip already imported transactions
- **Multi-Format Support**: Flexible column mapping for custom formats

### 🤖 ML Forecasting (HOJAI AI)
- **Seasonal Pattern Detection**: Identify monthly and weekly patterns
- **Anomaly Detection**: Detect unusual transactions automatically
- **AI-Powered Insights**: Integration with HOJAI for advanced predictions
- **Confidence Scoring**: Model accuracy metrics

### 💱 FX Hedging
- **Currency Risk Management**: Hedge exposure to USD, EUR, GBP, and other currencies
- **Forward Contracts**: Lock in exchange rates for future transactions
- **FX Options**: Currency options for flexible hedging
- **VaR Calculation**: Value at Risk metrics (95%, 99%)
- **Auto-Hedging**: Strategy-based automatic hedging

### 🔔 Webhooks
- **Event Notifications**: Real-time webhooks for all treasury events
- **HMAC Signatures**: Secure webhook delivery with signature verification
- **Auto-Retry**: Automatic retry with exponential backoff

### 📊 Error Handling
- **25+ Custom Error Classes**: Comprehensive error handling
- **Typed Errors**: Type-safe error handling with error codes

## Architecture

```
REZ-treasury-os/
├── src/
│   ├── config/          # Configuration
│   ├── models/          # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   │   ├── cashManagementService.ts    # Cash operations
│   │   ├── investmentService.ts       # Investment tracking
│   │   ├── forecastService.ts        # Forecasting
│   │   ├── webhookService.ts         # Webhooks
│   │   ├── bankStatement/           # Bank statement import
│   │   ├── mlForecasting/          # ML forecasting
│   │   └── fxHedging/              # FX hedging
│   ├── middleware/        # Auth & validation
│   ├── jobs/              # Scheduled jobs
│   ├── utils/             # Helpers & errors
│   └── __tests__/         # Unit tests
├── e2e/                   # E2E tests
├── Dockerfile
├── docker-compose.yml
├── nginx.conf              # Production nginx config
├── k8s-deployment.yaml     # Kubernetes deployment
└── prometheus.yml         # Metrics config
```

## API Endpoints

### Cash Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/accounts` | Create treasury account |
| GET | `/api/v1/accounts/:businessId` | Get all business accounts |
| GET | `/api/v1/accounts/:businessId/position` | Get consolidated cash position |
| POST | `/api/v1/accounts/:accountId/deposit` | Deposit funds |
| POST | `/api/v1/accounts/:accountId/withdraw` | Withdraw funds |
| POST | `/api/v1/transfers` | Transfer between accounts |
| GET | `/api/v1/cash-flow/:businessId` | Get cash flow summary |

### Investments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/investments` | Create investment |
| GET | `/api/v1/investments/:businessId` | List business investments |
| GET | `/api/v1/investments/:businessId/summary` | Investment portfolio summary |
| POST | `/api/v1/investments/:investmentId/redeem` | Redeem/foreclose investment |
| GET | `/api/v1/investments/:investmentId/returns` | Get return history |

### Forecasting
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/forecast/:businessId` | Generate 13-week forecast |
| GET | `/api/v1/forecast/:businessId/current` | Get current forecast |
| GET | `/api/v1/forecast/:businessId/shortfall` | Predict cash shortfall |
| PATCH | `/api/v1/forecast/:forecastId/actuals` | Update with actuals |
| GET | `/api/v1/alerts/:businessId` | Get active shortfall alerts |

### Bank Statement Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bank-statements/import` | Import bank statement |
| GET | `/api/v1/bank-statements/banks` | Get supported banks |

### FX Hedging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/fx/rate/:from/:to` | Get FX rate |
| POST | `/api/v1/fx/hedge` | Create hedge position |
| GET | `/api/v1/fx/exposure/:businessId` | Get FX exposure |
| GET | `/api/v1/fx/recommendations/:businessId` | Get hedge recommendations |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/webhooks` | Subscribe to webhooks |
| DELETE | `/api/v1/webhooks/:webhookId` | Unsubscribe |
| GET | `/api/v1/webhooks/:webhookId/deliveries` | Get delivery history |

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB 6+
- Redis 7+

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Docker

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f k8s-deployment.yaml
```

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/rez-treasury
REDIS_URL=redis://localhost:6379

# Service
PORT=4055
NODE_ENV=development

# Security
INTERNAL_SERVICE_TOKEN=your-secure-token

# HOJAI AI (for ML Forecasting)
HOJAI_GATEWAY_URL=http://localhost:4500
HOJAI_API_KEY=your-api-key
```

## Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Matured Investments | Daily 1 AM | Process matured investments, handle auto-renewals |
| Forecast Refresh | Weekly Mon 6 AM | Regenerate 13-week forecasts for all businesses |
| Alert Check | Every 4 hours | Check for unresolved critical alerts |
| Investment Value Update | Daily Midnight | Update investment values based on accrual |
| FX Position Update | Every 6 hours | Update unrealized P&L |
| Webhook Retry | Every 5 minutes | Retry failed webhook deliveries |

## Error Classes

```typescript
// Account Errors
AccountNotFoundError, AccountInactiveError, InvalidAccountTypeError

// Balance Errors
InsufficientBalanceError, NegativeAmountError, ZeroAmountError

// Transfer Errors
TransferToSameAccountError, CrossBusinessTransferError, CurrencyMismatchError

// Investment Errors
InvestmentNotFoundError, InvestmentNotActiveError, InvalidInterestRateError

// FX Errors
FXRateUnavailableError, HedgeNotFoundError, InvalidHedgeError

// External Errors
WalletServiceError, PaymentServiceError, DatabaseError, RedisError
```

## Webhook Events

```typescript
// Account Events
'account.created', 'account.updated', 'account.deactivated'

// Transaction Events
'transaction.deposit', 'transaction.withdrawal', 'transaction.transfer'

// Investment Events
'investment.created', 'investment.matured', 'investment.renewed', 'investment.foreclosed'

// Forecast Events
'forecast.generated', 'shortfall.predicted', 'shortfall.alert'

// FX Events
'fx.hedge.created', 'fx.hedge.settled', 'fx.exposure.altered'

// Alert Events
'alert.created', 'alert.acknowledged', 'alert.resolved', 'alert.escalated'
```

## Security

- Internal service authentication via `X-Internal-Token` header
- Helmet.js security headers
- CORS with configurable origins
- Input validation with Zod
- MongoDB injection prevention
- HMAC-SHA256 webhook signatures
- Rate limiting via nginx (configurable)

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## OpenAPI Documentation

OpenAPI spec available at `openapi/treasury-service.yaml`

## License

MIT

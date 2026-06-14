# ReZ Currency Service

A comprehensive currency conversion and exchange rate service providing real-time exchange rates, multi-currency conversion, fee calculations, and currency formatting for the ReZ ecosystem.

## Features

- **Multi-Currency Support**: 20+ supported currencies worldwide
- **Real-time Exchange Rates**: Live exchange rate updates
- **Currency Conversion**: Fast and accurate currency conversion
- **Batch Conversion**: Convert multiple amounts at once
- **Fee Calculation**: Calculate transaction and conversion fees
- **Currency Formatting**: Locale-aware currency formatting
- **Historical Rates**: View historical exchange rate data
- **Currency Metadata**: Country associations, symbols, decimal places

## Supported Currencies

| Currency | Code | Symbol | Countries |
|----------|------|--------|-----------|
| US Dollar | USD | $ | US, EC, SV, PA, TL, ZW |
| Euro | EUR | € | DE, FR, IT, ES, NL, BE, AT, PT, FI, IE |
| British Pound | GBP | £ | GB, IM, JE, GG |
| Japanese Yen | JPY | ¥ | JP |
| Chinese Yuan | CNY | ¥ | CN |
| Indian Rupee | INR | ₹ | IN |
| Australian Dollar | AUD | A$ | AU, NR, NF, CX |
| Canadian Dollar | CAD | C$ | CA |
| Swiss Franc | CHF | CHF | CH, LI |
| Singapore Dollar | SGD | S$ | SG |
| UAE Dirham | AED | د.إ | AE |
| Saudi Riyal | SAR | ﷼ | SA |
| Brazilian Real | BRL | R$ | BR |
| Mexican Peso | MXN | $ | MX |
| South African Rand | ZAR | R | ZA |
| South Korean Won | KRW | ₩ | KR |
| Thai Baht | THB | ฿ | TH |
| Malaysian Ringgit | MYR | RM | MY |
| Indonesian Rupiah | IDR | Rp | ID |
| Philippine Peso | PHP | ₱ | PH |

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=4026
NODE_ENV=development

# Exchange Rate API
EXCHANGE_API_KEY=your_api_key
EXCHANGE_API_URL=https://api.exchangerate-api.com/v4

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |

### Currencies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/currencies` | List all supported currencies |
| GET | `/api/currencies/:code` | Get currency details |

### Exchange Rates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rates` | Get all exchange rates |
| GET | `/api/rates/:from/:to` | Get specific exchange rate |
| GET | `/api/rates/:from/:to/history` | Get historical rates |
| POST | `/api/rates/refresh` | Refresh exchange rates |

### Conversion

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/convert` | Convert currency amount |
| POST | `/api/convert/batch` | Batch currency conversion |

### Fees

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fee` | Calculate transaction fee |

### Formatting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/format` | Format currency amount |

## Data Models

### ConversionRequest

```typescript
interface ConversionRequest {
  amount: number;
  from: string;
  to: string;
  roundResult?: boolean;
  decimalPlaces?: number;
}
```

### ConversionResult

```typescript
interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  timestamp: Date;
}
```

### ExchangeRate

```typescript
interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  timestamp: Date;
  source: string;
}
```

### FeeCalculation

```typescript
interface FeeCalculation {
  amount: number;
  currency: string;
  feeType: FeeType;
  feeAmount: number;
  feePercentage?: number;
  totalAmount: number;
}

enum FeeType {
  TRANSACTION = 'transaction',
  CONVERSION = 'conversion',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer'
}
```

## API Examples

### Convert Currency

```bash
curl -X POST http://localhost:4026/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "from": "USD",
    "to": "EUR"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "originalAmount": 100,
    "convertedAmount": 92,
    "rate": 0.92,
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Get Exchange Rate

```bash
curl http://localhost:4026/api/rates/USD/EUR
```

### Get All Rates

```bash
curl http://localhost:4026/api/rates
```

### Calculate Fee

```bash
curl -X POST http://localhost:4026/api/fee \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "feeType": "transaction",
    "percentage": 2.5
  }'
```

### Format Currency

```bash
curl "http://localhost:4026/api/format?amount=1234567.89&currency=USD"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "original": "1234567.89",
    "formatted": "$1,234,567.89",
    "currency": "USD"
  }
}
```

## Fee Types

| Type | Default Rate | Description |
|------|-------------|-------------|
| `transaction` | 2.5% | General transaction fee |
| `conversion` | 1.0% | Currency conversion fee |
| `withdrawal` | 1.5% | Withdrawal fee |
| `deposit` | 0% | No deposit fee |
| `transfer` | 1.0% | Transfer fee |

## Currency Formatting

Currency formatting is locale-aware and respects:

- Symbol position (before/after)
- Decimal separator (./,)
- Thousand separator (.,' )
- Decimal places (0, 2)

## Testing

```bash
npm test
```

## Deployment

### Docker

```bash
docker build -t rez-currency-service .
docker run -p 4026:4026 \
  -e EXCHANGE_API_KEY=your_api_key \
  -e LOG_LEVEL=info \
  rez-currency-service
```

## License

MIT

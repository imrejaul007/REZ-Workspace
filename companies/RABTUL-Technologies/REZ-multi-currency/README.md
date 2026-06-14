# REZ Multi-Currency

Currency conversion, exchange rates, and formatting.

## Quick Start

```bash
npm install
npm run dev
```

## Supported Currencies

| Code | Symbol | Name |
|------|--------|------|
| INR | ₹ | Indian Rupee |
| USD | $ | US Dollar |
| EUR | € | Euro |
| GBP | £ | British Pound |
| JPY | ¥ | Japanese Yen |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/convert | Convert currency |
| GET | /api/rates | Get exchange rates |
| POST | /api/format | Format currency |

## Example

```bash
curl -X POST http://localhost:4055/api/convert \
  -d '{"from": "USD", "to": "INR", "amount": 100}'
```

# REZ COD Intelligence

Cash on Delivery risk scoring and fraud detection.

## Quick Start

```bash
npm install
npm run dev
```

## Risk Factors

- Order value
- Customer history
- Address type
- Pincode risk

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/score | Calculate risk score |
| GET | /api/pincode/:pin | Pincode risk |

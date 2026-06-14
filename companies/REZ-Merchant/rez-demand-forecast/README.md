# Demand Forecasting

AI-powered demand forecasting. Port 3055.

## Features
- Sales history tracking
- Demand prediction using moving averages
- Trend analysis (up, down, stable)
- Reorder recommendations

## API
- GET /api/forecast/:productId - Get forecast for product
- GET /api/forecast - Get all forecasts
- POST /api/products - Add product
- POST /api/sales - Record sales

## Run
```bash
npm install && npm start
```
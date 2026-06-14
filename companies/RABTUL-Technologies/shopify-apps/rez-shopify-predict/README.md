# ReZ Predict - AI Predictions

AI-powered customer predictions for Shopify.

## Features

- [x] LTV prediction
- [x] Churn risk scoring
- [x] Revisit probability
- [x] Next purchase date prediction
- [x] High-value customer identification
- [x] At-risk customer detection

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict/customer` | POST | Get prediction for customer |
| `/predict/at-risk/:shop` | GET | Get at-risk customers |
| `/predict/high-value/:shop` | GET | Get high-value customers |

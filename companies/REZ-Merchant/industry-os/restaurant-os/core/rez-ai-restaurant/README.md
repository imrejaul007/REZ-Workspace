# REZ AI Restaurant

AI-powered restaurant service for intelligent operations.

## Overview

This service provides AI capabilities for restaurant operations including:
- Menu recommendations
- Customer sentiment analysis
- Demand prediction
- Order optimization

## Port

Configured via environment variables.

## Dependencies

- axios
- mongoose
- winston

## Features

- Menu recommendation engine
- Customer feedback analysis
- Sales trend analysis
- Predictive analytics

## API Endpoints

- `GET /health` - Health check
- `POST /recommend` - Get menu recommendations
- `POST /analyze` - Analyze customer feedback

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rez-ai-restaurant
```

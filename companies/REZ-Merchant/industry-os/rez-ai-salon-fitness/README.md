# REZ AI Salon & Fitness

AI-powered service for salon and fitness industry operations.

## Overview

This service provides AI capabilities for:
- Salon service recommendations
- Fitness class suggestions
- Customer preference learning
- Booking optimization

## Port

Configured via environment variables.

## Dependencies

- axios
- mongoose
- winston

## Features

- Personalized service recommendations
- Customer behavior analysis
- Peak hour predictions
- Member retention scoring

## API Endpoints

- `GET /health` - Health check
- `POST /recommend` - Get service recommendations
- `POST /analyze` - Analyze customer preferences

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rez-ai-salon-fitness
```

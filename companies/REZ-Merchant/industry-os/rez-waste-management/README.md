# REZ Waste Management

Inventory waste tracking and analytics.

## Overview

Track and reduce waste in food service:
- Spoilage tracking
- Waste logging
- Analytics dashboard
- Cost analysis

## Dependencies

- express
- mongoose
- helmet

## Features

- Waste category tracking
- Photo documentation
- Cost attribution
- Trend analysis
- Sustainability reporting

## API Endpoints

- `POST /log` - Log waste entry
- `GET /analytics` - Get waste analytics
- `GET /trends` - View trends

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rez-waste-management
```

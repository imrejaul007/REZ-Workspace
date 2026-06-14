# Personalization Rules Service

Rule-based personalization management for AdBazaar.

## Features

- Rule creation and management
- Multiple condition operators
- AND/OR condition logic
- Priority-based rule evaluation
- Scheduling support
- Action types: show_content, hide_content, personalize, recommend, redirect, modify_price, apply_banner, send_notification

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rules | Create rule |
| GET | /api/rules | List rules |
| GET | /api/rules/:id | Get rule |
| PUT | /api/rules/:id | Update rule |
| POST | /api/rules/:id/test | Test rule |
| POST | /api/rules/evaluate | Evaluate rules |
| DELETE | /api/rules/:id | Archive rule |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/personalization-rules-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5096 | Service port |
| MONGODB_URI | mongodb://localhost:27017/personalization-rules | MongoDB connection |
# BIZORA Quote Builder

HRMS Quote generation and management service for CorpPerks BIZORA platform.

## Features

- Create and manage HRMS quotes
- Line item management with calculations
- PDF generation for quotes
- Quote acceptance/rejection workflow
- Customer quote tracking
- Automatic expiration handling

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/quotes | List all quotes |
| GET | /api/quotes/:id | Get quote by ID |
| POST | /api/quotes | Create new quote |
| PUT | /api/quotes/:id | Update quote |
| POST | /api/quotes/:id/accept | Accept quote |
| POST | /api/quotes/:id/reject | Reject quote |
| GET | /api/quotes/:id/pdf | Generate PDF |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4009 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/bizora-quotes |
| NODE_ENV | Environment | development |

## Tech Stack

- Express.js - Web framework
- MongoDB/Mongoose - Database
- PDFKit - PDF generation
- Zod - Schema validation
- Winston - Logging
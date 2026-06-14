# REZ Pharmacy Service

Pharmacy Management System

**Port:** 4008

## Features

- Medicine inventory management
- Prescription management
- Prescription verification and approval
- Drug interaction checking
- Order management
- Inventory alerts
- Patient prescription history
- E-prescription support

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/medicines/* | Medicine management routes |
| POST | /api/orders/* | Order management routes |
| POST | /api/prescriptions | Create prescription |
| GET | /api/prescriptions/:id | Get prescription by ID |
| GET | /api/prescriptions/patient/:patientId | Get patient prescriptions |
| POST | /api/prescriptions/:id/verify | Verify prescription |
| GET | /api/prescriptions/status/pending | Get pending prescriptions |
| GET | /api/prescriptions/expiring | Get expiring prescriptions |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4008 | Service port |
| MONGODB_URI | mongodb://localhost:27017/rez-pharmacy | MongoDB connection string |
| NODE_ENV | development | Environment (production/development) |
| CORS_ORIGIN | - | Allowed CORS origins (comma-separated) |

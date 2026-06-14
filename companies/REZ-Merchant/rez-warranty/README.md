# REZ Warranty Service

**Version:** 1.0.0  
**Service Name:** rez-warranty  
**Port:** 4620

---

## Overview

Product warranty management and tracking service. Handles warranty registration, claim processing, product tracking, and expiration management.

## Features

- **Warranty Registration** - Register products with warranty period tracking
- **Warranty Verification** - Verify warranty status by serial number
- **Warranty Extension** - Extend warranty periods
- **Ownership Transfer** - Transfer warranty to new owners
- **Claim Management** - File, process, and resolve warranty claims
- **Product Management** - Track products and base warranty periods
- **Reports & Analytics** - Warranty and claim statistics

## Quick Start

```bash
cd rez-warranty
npm install
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Warranty Management
```
POST   /api/warranties                    - Register warranty
GET    /api/warranties                    - List warranties
GET    /api/warranties/:id               - Get warranty
GET    /api/warranties/verify/:serial     - Verify by serial
POST   /api/warranties/:id/extend         - Extend warranty
POST   /api/warranties/:id/transfer       - Transfer ownership
DELETE /api/warranties/:id               - Cancel warranty
GET    /api/warranties/:id/claims         - Get warranty claims
```

### Claims
```
POST /api/claims           - File claim
GET  /api/claims           - List claims
GET  /api/claims/:id       - Get claim
PUT  /api/claims/:id       - Update claim
POST /api/claims/:id/assign   - Assign to agent
POST /api/claims/:id/resolve  - Resolve claim
POST /api/claims/:id/reject   - Reject claim
```

### Products
```
POST /api/products     - Register product
GET  /api/products     - List products
GET  /api/products/:id - Get product
```

### Reports
```
GET /api/reports/stats - Statistics
```

## Environment Variables

```bash
PORT=4620                  # Service port (default: 4620)
```

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
```
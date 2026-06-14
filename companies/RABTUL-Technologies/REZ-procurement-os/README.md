# REZ Procurement OS

B2B marketplace & RFQ management service for the Nexha Commerce Network.

## Port: 4342

## Features

- Supplier registration and management
- RFQ (Request for Quote) creation and publishing
- Quote submission and comparison
- Purchase order management
- Contract lifecycle management
- Supplier verification and ratings
- Expiring contract alerts

## API Endpoints

### Health
- `GET /health` - Service health status

### Suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get supplier
- `PUT /api/suppliers/:id` - Update supplier

### RFQs
- `POST /api/rfqs` - Create RFQ
- `GET /api/rfqs` - List RFQs
- `GET /api/rfqs/:id` - Get RFQ
- `PATCH /api/rfqs/:id/status` - Update RFQ status

### Quotes
- `POST /api/quotes` - Submit quote
- `GET /api/rfqs/:rfqId/quotes` - Get quotes for RFQ
- `PATCH /api/quotes/:id/status` - Update quote status

### Purchase Orders
- `POST /api/purchase-orders` - Create PO
- `GET /api/purchase-orders` - List POs
- `GET /api/purchase-orders/:id` - Get PO
- `PATCH /api/purchase-orders/:id/status` - Update PO status

### Contracts
- `POST /api/contracts` - Create contract
- `GET /api/suppliers/:id/contracts` - Get supplier contracts
- `GET /api/contracts/expiring` - Get expiring contracts

### Stats
- `GET /api/stats` - Get procurement statistics

## Running

```bash
npm install
npm run build
npm start
```

# REZ Retail POS

Point of Sale system for retail stores.

## Overview

Modern POS system for retail operations:
- Product scanning
- Inventory management
- Customer checkout
- Payment processing

## Dependencies

- express
- mongoose
- uuid

## Features

- Barcode scanning
- Multiple payment methods
- Real-time inventory sync
- Customer loyalty integration
- Receipt generation

## API Endpoints

- `POST /checkout` - Process sale
- `GET /products/:barcode` - Lookup product
- `POST /refund` - Process refund

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rez-retail-pos
```

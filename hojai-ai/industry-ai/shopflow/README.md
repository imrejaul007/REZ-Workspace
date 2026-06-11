# SHOPFLOW - Retail AI Operating System

A comprehensive, production-ready retail management system with AI-powered agents for inventory management, customer loyalty, and checkout operations.

## Features

### AI Agents
- **Inventory Agent**: Stock management, low stock alerts, auto-reorder
- **Loyalty Agent**: Points management, tier system, rewards redemption
- **Customer Agent**: 360 degree customer profiles, segmentation, churn prediction
- **Checkout Agent**: Fast POS transactions, multiple payment methods

### Technical Stack
- Node.js with TypeScript
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Helmet, CORS, Rate Limiting
- Winston Logging
- Zod Validation

## Installation

```bash
npm install
npm run build
npm start
```

## Configuration

Create .env file:
```env
PORT=4830
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shopflow
JWT_SECRET=your-secret-key
```

## API Endpoints

### AI Agents
- GET /ai/status - Agent status
- POST /api/ai/inventory/check - Check low stock
- POST /api/ai/inventory/reorder - Auto reorder
- POST /api/ai/loyalty/points - Get loyalty info
- POST /api/ai/customer/profile - Customer 360

### Products
- POST /api/products
- GET /api/products
- PATCH /api/products/:id/stock

### Customers
- POST /api/customers
- GET /api/customers
- PATCH /api/customers/:id/loyalty

### Sales
- POST /api/sales
- GET /api/sales

### POS
- POST /api/pos/sale

### Analytics
- GET /api/analytics/dashboard

## Health Checks
- GET /health
- GET /ready

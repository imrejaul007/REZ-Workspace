# Commerce OS

## Overview
Unified commerce across all industries for RTMN.

## Port: 3022

## Features
- **Transactions**: Multi-industry transaction processing
- **Order Management**: Full order lifecycle
- **Payments**: Unified payment processing
- **Fulfillment**: Order fulfillment orchestration

## Transaction Types
- sale, purchase, refund, transfer, subscription

## Order Status
- pending, confirmed, processing, shipped, delivered, cancelled, refunded

## Payment Methods
- card, bank, wallet, crypto, invoice

## Routes
- `transactions.js` - Transaction processing
- `orders.js` - Order management
- `payments.js` - Payment processing
- `fulfillment.js` - Fulfillment tracking

## API Endpoints
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `POST /api/payments` - Process payment
- `GET /api/fulfillment` - Get fulfillment status

## Industry Coverage
All 24 RTMN industries supported.

## Dependencies
- express, cors, helmet, redis, uuid, winston

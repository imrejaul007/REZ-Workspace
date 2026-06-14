# REZ Self-Service Kiosk

Self-ordering kiosk for restaurants and retail.

## Overview

Touch-screen self-service terminal:
- Menu browsing
- Order customization
- Payment processing
- Receipt printing

## Dependencies

- express
- socket.io

## Features

- Multi-language support
- Accessibility options
- Cash and card payments
- Order queue display

## API Endpoints

- `GET /menu` - Get menu
- `POST /order` - Place order
- `GET /status/:orderId` - Check order status

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=3000
KIOSK_ID=kiosk-001
```

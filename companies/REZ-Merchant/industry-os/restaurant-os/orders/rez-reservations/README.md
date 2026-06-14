# REZ Restaurant Reservations

Table reservation and booking management for restaurants.

## Overview

Comprehensive reservation system:
- Table availability
- Booking management
- Waitlist handling
- Confirmation system

## Dependencies

- express
- mongoose
- helmet

## Features

- Real-time table availability
- Multi-time slot support
- Guest preferences
- Waitlist management
- SMS/Email confirmations
- Cancellation handling

## API Endpoints

- `POST /reservations` - Create reservation
- `GET /reservations/:id` - Get reservation
- `PUT /reservations/:id` - Update reservation
- `DELETE /reservations/:id` - Cancel reservation
- `GET /availability` - Check table availability
- `POST /waitlist` - Join waitlist

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rez-reservations
```

# Subscription Billing Service

Recurring billing management for AdBazaar.

## Overview

Complete subscription billing with:
- Multiple billing cycles
- Invoice generation
- Payment processing
- Auto-renewal
- Revenue tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/billing` | Create billing |
| GET | `/api/billing/:id` | Get billing |
| PUT | `/api/billing/:id` | Update billing |
| POST | `/api/billing/:id/charge` | Charge invoice |
| GET | `/api/billing/:id/history` | Get history |
| POST | `/api/billing/:id/cancel` | Cancel billing |
| GET | `/api/billing/stats` | Get stats |

## Port

**5110**
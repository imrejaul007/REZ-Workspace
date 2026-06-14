# CLAUDE.md - Ridza Remittance

## Project Overview

**Name:** Ridza Remittance  
**Company:** RidZa  
**Type:** P2P Transfers & Cross-border Payments  
**Port:** 4540  
**Tagline:** P2P Transfers & Cross-border Payments

## Product Description

P2P transfers and cross-border payments for GCC expats.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB
- **Security:** Helmet, CORS

## API Endpoints

### Money Transfer
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transfer/quote` | POST | Get transfer quote |
| `/api/transfer/send` | POST | Send money |
| `/api/transfer/:id` | GET | Check status |
| `/api/transfer/:id/cancel` | POST | Cancel transfer |

### Exchange Rates
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rates` | GET | Current rates |
| `/api/rates/convert` | POST | Convert amount |

### Recipient Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recipients` | POST | Add recipient |
| `/api/recipients` | GET | List recipients |
| `/api/recipients/:id` | PUT | Update recipient |
| `/api/recipients/:id` | DELETE | Delete recipient |

## Supported Currencies
USD, AED, INR, GBP, EUR, SAR, QAR, KWD, BHD, OMR

## Features Checklist

- [x] Real-time exchange rates
- [x] Multi-currency support
- [x] Transfer tracking
- [x] KYC integration
- [x] Recipient management
- [x] Rate locking
- [x] Health check endpoints
- [x] Docker support

**Last Updated:** 2026-06-12

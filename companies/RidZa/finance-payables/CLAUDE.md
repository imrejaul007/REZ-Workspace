# CLAUDE.md - Finance Payables

## Project Overview

**Name:** Finance Payables  
**Company:** RidZa  
**Type:** Bill Tracking & Vendor Management  
**Port:** 3000  
**Tagline:** Pay Bills & Manage Vendors

## Product Description

Bill tracking, vendor management, and payment scheduling service.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB with Mongoose
- **Security:** Helmet, CORS, JWT
- **Validation:** Zod

## API Endpoints

### Vendor Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vendors` | POST | Create vendor |
| `/api/vendors/:tenantId` | GET | List vendors |
| `/api/vendors/:tenantId/:id` | GET | Get vendor |
| `/api/vendors/:tenantId/:id` | PUT | Update vendor |
| `/api/vendors/:tenantId/:id` | DELETE | Delete vendor |

### Bill Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bills` | POST | Create bill |
| `/api/bills/:tenantId` | GET | List bills |
| `/api/bills/:tenantId/:id` | GET | Get bill |
| `/api/bills/:tenantId/:id` | PUT | Update bill |
| `/api/bills/:tenantId/:id/pay` | POST | Pay bill |
| `/api/schedule/:tenantId` | GET | Payment schedule |

## Features Checklist

- [x] Vendor CRUD
- [x] Bill tracking
- [x] Payment scheduling
- [x] Cash flow optimization
- [x] GSTIN/PAN validation
- [x] JWT authentication
- [x] Health check endpoints
- [x] Docker support

**Last Updated:** 2026-06-12

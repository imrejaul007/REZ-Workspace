# CLAUDE.md - Finance Compliance

## Project Overview

**Name:** Finance Compliance  
**Company:** RidZa  
**Type:** GST, TDS, Payroll Compliance  
**Port:** 3000  
**Tagline:** Compliance Made Simple

## Product Description

GST, TDS, and payroll compliance management service with filing reminders.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Security:** Helmet, CORS, JWT
- **Validation:** Zod

## API Endpoints

### GST Compliance
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gst/calculate` | POST | Calculate GST |

### TDS Compliance
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tds/:tenantId` | GET | TDS compliance check |
| `/api/tds/calculate` | POST | Calculate TDS |

### Payroll Compliance
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payroll/compliance` | POST | Payroll compliance |
| `/api/filing/reminders` | GET | Upcoming deadlines |
| `/api/status/:tenantId` | GET | Overall compliance |

## GST Slabs
5%, 12%, 18%, 28%

## TDS Rates
10%, 20%, 30%

## Features Checklist

- [x] GST calculation
- [x] TDS calculation
- [x] HSN code validation
- [x] Filing reminders
- [x] Payroll compliance
- [x] JWT authentication
- [x] Health check endpoints
- [x] Docker support

**Last Updated:** 2026-06-12

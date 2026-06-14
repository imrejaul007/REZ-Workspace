# CLAUDE.md - Ridza Islamic Finance

## Project Overview

**Name:** Ridza Islamic Finance  
**Company:** RidZa  
**Type:** Sharia-Compliant Financial Products  
**Port:** 4530  
**Tagline:** Sharia-Compliant Financial Products

## Product Description

Sharia-compliant financial products including BNPL, Zakat calculator, and Islamic lending.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB
- **Security:** Helmet, CORS

## API Endpoints

### BNPL
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bnpl/apply` | POST | Apply for BNPL |
| `/api/bnpl/plans` | GET | List BNPL plans |
| `/api/bnpl/calculate` | POST | Calculate BNPL |

### Zakat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/zakat/calculate` | POST | Calculate Zakat |
| `/api/zakat/history/:userId` | GET | Zakat history |

### Islamic Lending
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lending/apply` | POST | Apply for loan |
| `/api/lending/status/:id` | GET | Check status |
| `/api/lending/murabaha` | POST | Murabaha financing |
| `/api/lending/ijara` | POST | Ijara financing |

## Islamic Finance Products
- Murabaha - Cost-plus financing
- Ijara - Lease financing
- Musharaka - Partnership financing

## Zakat Calculation
2.5% of total wealth above Nisab threshold (85g gold)

## Features Checklist

- [x] Sharia-compliant BNPL
- [x] Zakat calculator
- [x] Murabaha financing
- [x] Ijara financing
- [x] Gold price integration
- [x] Health check endpoints
- [x] Docker support

**Last Updated:** 2026-06-12

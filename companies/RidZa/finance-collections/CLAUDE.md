# CLAUDE.md - Finance Collections

## Project Overview

**Name:** Finance Collections  
**Company:** RidZa  
**Type:** AI Collections Manager  
**Port:** 3000  
**Tagline:** AR Collections & Follow-ups

## Product Description

AI-powered accounts receivable collections with AR aging analysis and automated follow-ups.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB with Mongoose
- **Security:** Helmet, CORS, JWT
- **Validation:** Zod

## API Endpoints

### AR Aging
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/aging/:tenantId` | GET | AR aging analysis |

### Follow-up Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/follow-up` | POST | Schedule follow-up |
| `/api/receivables/:tenantId` | GET | List receivables |
| `/api/receivables/:tenantId/:id` | PUT | Update receivable |
| `/api/reminders/:tenantId` | POST | Generate reminders |

## Aging Buckets
- current, 1-30, 31-60, 61-90, 91+

## Features Checklist

- [x] AR aging analysis
- [x] Follow-up scheduling
- [x] Multi-channel reminders
- [x] Payment recording
- [x] JWT authentication
- [x] Health check endpoints
- [x] Docker support

**Last Updated:** 2026-06-12

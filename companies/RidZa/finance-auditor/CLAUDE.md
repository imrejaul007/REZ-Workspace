# CLAUDE.md - Finance Auditor

## Project Overview

**Name:** Finance Auditor  
**Company:** RidZa  
**Type:** AI Fraud Detection & Risk Assessment  
**Port:** 3000  
**Tagline:** Fraud Detection & Risk Assessment

## Product Description

AI-powered fraud detection, audit support, and risk assessment service. Real-time transaction monitoring with pattern analysis and anomaly detection.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB with Mongoose
- **Security:** Helmet, CORS, JWT, Rate Limiting
- **Validation:** Zod

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## API Endpoints

### Fraud Detection
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fraud/detect` | POST | Single transaction fraud check |
| `/api/fraud/batch` | POST | Batch fraud detection (up to 100) |

### Duplicate Detection
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/duplicate/check` | POST | Check single invoice |
| `/api/duplicate/batch-check` | POST | Batch duplicate check |

### Risk Assessment
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/risk/:tenantId` | GET | Get cached risk assessment |
| `/api/risk/:tenantId/assess` | POST | Trigger new assessment |

### Alerts & Reports
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts/:tenantId` | GET | List tenant alerts |
| `/api/alerts/:alertId/acknowledge` | PUT | Acknowledge alert |
| `/api/reports/:tenantId` | GET | List audit reports |
| `/api/reports/:tenantId/generate` | POST | Generate audit report |

## Risk Levels
- `low` - Normal transaction
- `medium` - Requires attention
- `high` - Action required
- `critical` - Immediate action needed

## Alert Types
- `fraud` - Fraud detected
- `duplicate` - Duplicate transaction
- `compliance` - Compliance issue
- `anomaly` - Anomalous behavior

## Features Checklist

- [x] Real-time fraud detection
- [x] Batch fraud detection
- [x] Duplicate invoice detection
- [x] Risk assessment with caching
- [x] Alert generation & management
- [x] Audit report generation
- [x] Rate limiting
- [x] JWT authentication
- [x] Health check endpoints
- [x] Docker support

**Last Updated:** 2026-06-12

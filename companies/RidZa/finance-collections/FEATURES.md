# Finance Collections - Features

**Product:** AI Collections Manager  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 3000

---

## Overview

AI-powered accounts receivable collections with AR aging analysis and automated follow-ups.

### Tagline
\`AR Collections & Follow-ups\`

---

## Core Features

### 1. AR Aging Analysis

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| AR Aging Report | \`/api/aging/:tenantId\` | GET | Get AR aging analysis |
| Get Receivables | \`/api/receivables/:tenantId\` | GET | List all receivables |

#### Aging Buckets
- \`current\` - Not yet due
- \`1-30\` - 1-30 days overdue
- \`31-60\` - 31-60 days overdue
- \`61-90\` - 61-90 days overdue
- \`91+\` - Over 91 days overdue

---

### 2. Follow-up Management

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Follow-up | \`/api/follow-up\` | POST | Schedule follow-up |
| Batch Reminders | \`/api/reminders/:tenantId\` | POST | Generate reminders |

#### Channel Options
- WhatsApp
- Email
- SMS

---

## Features Checklist

- [x] AR aging analysis
- [x] Time bucket breakdown
- [x] Follow-up scheduling
- [x] Multi-channel follow-ups
- [x] Receivables CRUD
- [x] Payment recording
- [x] Health checks
- [x] JWT authentication
- [x] Docker support

**Last Updated:** 2026-06-12

# Finance Compliance - Features

**Product:** HOJAI Finance Compliance AI  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 3000

---

## Overview

GST, TDS, and payroll compliance management service.

### Tagline
\`Compliance Made Simple\`

---

## Core Features

### 1. GST Compliance

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| GST Calculate | \`/api/gst/calculate\` | POST | Calculate GST amount |
| Filing Reminders | \`/api/filing/reminders\` | GET | Upcoming deadlines |

#### GST Slabs
- 5% - Essential items
- 12% - Standard items
- 18% - Most goods/services
- 28% - Luxury items

---

### 2. TDS Compliance

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| TDS Check | \`/api/tds/:tenantId\` | GET | TDS compliance check |
| TDS Calculate | \`/api/tds/calculate\` | POST | Calculate TDS |

#### TDS Sections
- 194A - Interest income (10%)
- 194C - Contractor payments (2%)
- 194H - Commission/brokerage (10%)
- 194I - Rent (10%/20%)
- 194J - Professional fees (10%)

---

### 3. Payroll Compliance

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Payroll Compliance | \`/api/payroll/compliance\` | POST | Payroll compliance check |

---

## Features Checklist

- [x] GST calculation
- [x] HSN code validation
- [x] TDS calculation
- [x] Section-based TDS
- [x] Filing reminders
- [x] Payroll compliance
- [x] Health checks
- [x] JWT authentication
- [x] Docker support

**Last Updated:** 2026-06-12

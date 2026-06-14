# Finance Auditor - Features

**Product:** AI Finance Auditor  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 3000

---

## Overview

AI-powered fraud detection, audit support, and risk assessment service.

### Tagline
\`Fraud Detection & Risk Assessment\`

---

## Core Features

### 1. Fraud Detection

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Detect Fraud | \`/api/fraud/detect\` | POST | Single transaction fraud check |
| Batch Fraud | \`/api/fraud/batch\` | POST | Batch fraud detection (up to 100) |

#### Fraud Detection Features
- [x] Real-time fraud scoring (0-100)
- [x] Risk level classification (low/medium/high/critical)
- [x] Pattern-based detection
- [x] Z-score anomaly detection
- [x] Alert generation

---

### 2. Duplicate Detection

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Check Duplicate | \`/api/duplicate/check\` | POST | Check single invoice |
| Batch Check | \`/api/duplicate/batch-check\` | POST | Batch duplicate detection |

---

### 3. Risk Assessment

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get Risk | \`/api/risk/:tenantId\` | GET | Get cached assessment |
| Assess Risk | \`/api/risk/:tenantId/assess\` | POST | Trigger new assessment |

---

### 4. Alerts & Reports

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get Alerts | \`/api/alerts/:tenantId\` | GET | List tenant alerts |
| Get Reports | \`/api/reports/:tenantId\` | GET | List audit reports |
| Generate Report | \`/api/reports/:tenantId/generate\` | POST | Generate new report |

---

## Features Checklist

- [x] Real-time fraud detection
- [x] Batch fraud detection
- [x] Duplicate invoice detection
- [x] Risk assessment
- [x] Alert management
- [x] Audit report generation
- [x] Rate limiting
- [x] JWT authentication
- [x] Health checks
- [x] Docker support

**Last Updated:** 2026-06-12

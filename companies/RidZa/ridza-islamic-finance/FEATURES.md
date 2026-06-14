# Ridza Islamic Finance - Features

**Product:** HOJAI Islamic Finance  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 4530

---

## Overview

Sharia-compliant financial products including BNPL, Zakat calculator, and Islamic lending.

### Tagline
\`Sharia-Compliant Financial Products\`

---

## Core Features

### 1. BNPL (Buy Now Pay Later)

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| BNPL Apply | \`/api/bnpl/apply\` | POST | Apply for BNPL |
| BNPL Plans | \`/api/bnpl/plans\` | GET | List BNPL plans |
| BNPL Calculate | \`/api/bnpl/calculate\` | POST | Calculate BNPL |

---

### 2. Zakat Calculator

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Zakat Calculate | \`/api/zakat/calculate\` | POST | Calculate Zakat |
| Zakat History | \`/api/zakat/history/:userId\` | GET | Get Zakat history |

#### Zakat Calculation
- 2.5% of total wealth above Nisab threshold
- Nisab = 85g of gold (approximately)

---

### 3. Islamic Lending

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Lending Apply | \`/api/lending/apply\` | POST | Apply for Islamic loan |
| Lending Status | \`/api/lending/status/:id\` | GET | Check application |
| Murabaha | \`/api/lending/murabaha\` | POST | Murabaha financing |
| Ijara | \`/api/lending/ijara\` | POST | Ijara (lease) financing |

#### Islamic Finance Products
- **Murabaha** - Cost-plus financing
- **Ijara** - Lease financing
- **Musharaka** - Partnership financing

---

## Features Checklist

- [x] Sharia-compliant BNPL
- [x] Zakat calculator
- [x] Murabaha financing
- [x] Ijara financing
- [x] Gold price integration
- [x] Nisab threshold calculation
- [x] Health checks
- [x] Docker support

**Last Updated:** 2026-06-12

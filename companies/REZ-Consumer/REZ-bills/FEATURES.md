# REZ-bills - Bill Payment Features

**Status:** ✅ PRODUCTION READY
**Port:** 3012

---

## FEATURES

### Receipt Management

| Feature | Description | Status |
|---------|-------------|--------|
| **Receipt Scanning** | OCR parsing | ✅ |
| **Warranty Detection** | Auto-detect from receipts | ✅ |
| **Bill Storage** | Cloud storage | ✅ |
| **Categories** | Restaurant, grocery, etc. | ✅ |

### Cashback System

| Feature | Rate | Status |
|---------|------|--------|
| Restaurant | 2% | ✅ |
| Shopping | 1.5% | ✅ |
| Grocery | 1% | ✅ |
| Electronics | 1% | ✅ |
| Default | 0.5% | ✅ |

### Tax Records

| Feature | Description | Status |
|---------|-------------|--------|
| **Year-end Summary** | Total spent | ✅ |
| **Category Breakdown** | By category | ✅ |
| **Export** | PDF, CSV | ✅ |

### Warranty Tracking

| Feature | Description | Status |
|---------|-------------|--------|
| **Auto Tracking** | From receipts | ✅ |
| **Expiry Alerts** | Before expiry | ✅ |
| **Claim Link** | Direct to merchant | ✅ |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/bills` | GET | List bills |
| `/api/bills` | POST | Create bill |
| `/api/bills/:id` | GET | Get bill |
| `/api/bills/:id/claim-cashback` | POST | Claim cashback |
| `/api/bills/tax-records/:year` | GET | Tax records |

---

## TECHNICAL STACK

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB
- **Rate Limiting:** ✅
- **API Docs:** Swagger ✅

---

**Last Updated:** June 12, 2026

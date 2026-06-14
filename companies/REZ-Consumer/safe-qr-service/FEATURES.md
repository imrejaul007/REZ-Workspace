# safe-qr-service - Emergency QR Features

**Status:** ✅ PRODUCTION READY
**Port:** 4001

---

## 15 EMERGENCY MODES

| Mode | Description | Status |
|------|-------------|--------|
| **Pet** | Lost pet info | ✅ |
| **Personal** | Contact info | ✅ |
| **Device** | Device registration | ✅ |
| **Medical** | Health info, blood type | ✅ |
| **Helmet** | Two-wheeler safety | ✅ |
| **Child** | Child safety info | ✅ |
| **Vehicle** | Vehicle registration | ✅ |
| **Emergency** | SOS alert | ✅ |
| **Business** | Business card | ✅ |
| **Event** | Event check-in | ✅ |
| **Travel** | Travel info | ✅ |
| **Product** | Product info | ✅ |
| **Custom** | User-defined | ✅ |
| **Community** | Community alerts | ✅ |
| **Anonymous** | Privacy mode | ✅ |

---

## FEATURES

### QR Generation

| Feature | Description | Status |
|---------|-------------|--------|
| **Unique QR** | Per user | ✅ |
| **Mode Selection** | 15 modes | ✅ |
| **Customization** | Colors, style | ✅ |
| **Download** | Save as image | ✅ |

### Karma System

| Feature | Description | Status |
|---------|-------------|--------|
| **Community Trust** | Reputation score | ✅ |
| **Help Count** | Times helped | ✅ |
| **Response Rate** | Help quality | ✅ |

### Emergency Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Lost Mode** | Device protection | ✅ |
| **Express Recovery** | Quick return | ✅ |
| **SOS Alerts** | Emergency contacts | ✅ |

### Support System

| Feature | Description | Status |
|---------|-------------|--------|
| **Request Help** | QR scan help | ✅ |
| **Plans** | Premium support | ✅ |
| **Merchant** | Business profiles | ✅ |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/qr/generate` | POST | Generate QR |
| `/api/qr/:shortcode` | GET | Get QR data |
| `/api/support/request` | POST | Request help |
| `/api/express-recovery` | POST | Express recovery |
| `/api/merchant/register` | POST | Register merchant |

---

## TECHNICAL STACK

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB + Redis
- **Security:** Helmet, CORS, Rate Limit ✅

---

**Last Updated:** June 12, 2026

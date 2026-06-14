# rez-payment-service - Payment Service

**Port:** 4001
**Status:** ✅ Production Ready

---

## FEATURES

### Payment Methods

| Feature | Description | Status |
|---------|-------------|--------|
| **UPI** | Unified Payments Interface | ✅ |
| **Cards** | Credit/Debit cards | ✅ |
| **Net Banking** | Bank transfers | ✅ |
| **Wallets** | Third-party wallets | ✅ |
| **EMI** | Equated Monthly Installments | ✅ |
| **COD** | Cash on Delivery | ✅ |

### Payment Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Razorpay Integration** | Payment gateway | ✅ |
| **Split Payments** | Multiple recipients | ✅ |
| **Partial Payments** | Pay in installments | ✅ |
| **Refunds** | Full/Partial refunds | ✅ |
| **Webhooks** | Payment notifications | ✅ |
| **Idempotency** | Duplicate prevention | ✅ |

### Security

| Feature | Description | Status |
|---------|-------------|--------|
| **Signature Verification** | Webhook validation | ✅ |
| **Encryption** | AES-256 | ✅ |
| **PCI DSS** | Card data protection | ✅ |
| **Fraud Detection** | Risk assessment | ✅ |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/payments/initiate` | POST | Start payment |
| `/payments/capture` | POST | Capture payment |
| `/payments/refund` | POST | Process refund |
| `/payments/webhook` | POST | Payment webhook |
| `/payments/verify` | GET | Verify payment |

---

## TECHNOLOGY

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB
- **Gateway:** Razorpay
- **Security:** Webhook signature, encryption

---

**Last Updated:** June 14, 2026

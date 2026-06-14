# rez-wallet-service - Wallet Service

**Port:** 4004
**Status:** ✅ Production Ready

---

## FEATURES

### Wallet Operations

| Feature | Description | Status |
|---------|-------------|--------|
| **Balance** | View wallet balance | ✅ |
| **Add Money** | Top up wallet | ✅ |
| **Send Money** | P2P transfers | ✅ |
| **Receive Money** | Incoming transfers | ✅ |
| **Withdraw** | Bank transfer | ✅ |
| **Transactions** | History tracking | ✅ |

### Multi-Currency

| Feature | Description | Status |
|---------|-------------|--------|
| **INR** | Indian Rupee | ✅ |
| **USD** | US Dollar | ✅ |
| **EUR** | Euro | ✅ |
| **GBP** | British Pound | ✅ |
| **Auto-Convert** | Currency conversion | ✅ |

### Coins System

| Feature | Description | Status |
|---------|-------------|--------|
| **REZ Coins** | Loyalty currency | ✅ |
| **Earn** | Transaction rewards | ✅ |
| **Redeem** | Spend coins | ✅ |
| **Expiry** | Coin validity | ✅ |

### Security

| Feature | Description | Status |
|---------|-------------|--------|
| **PIN** | Wallet PIN | ✅ |
| **Biometric** | Fingerprint/Face | ✅ |
| **Limits** | Transaction limits | ✅ |
| **Otp** | High-value confirm | ✅ |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wallet/balance` | GET | Get balance |
| `/wallet/credit` | POST | Add money |
| `/wallet/debit` | POST | Spend money |
| `/wallet/transfer` | POST | P2P transfer |
| `/wallet/transactions` | GET | Transaction history |
| `/wallet/withdraw` | POST | Withdraw to bank |

---

## TECHNOLOGY

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB
- **Cache:** Redis
- **Security:** Encryption, PIN

---

**Last Updated:** June 14, 2026

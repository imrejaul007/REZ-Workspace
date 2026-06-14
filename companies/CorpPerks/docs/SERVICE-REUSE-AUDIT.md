# CorpPerks - Service Reuse Audit

**Date:** May 16, 2026

## REZ Services Available for CorpPerks

### RABTUL-Technologies Services

| Service | Port | Use Case | CorpPerks Integration |
|---------|------|----------|----------------------|
| `rez-auth-service` | 3000 | Login, OTP | ✅ Use for employee login |
| `rez-profile-service` | 4001 | User profiles | ✅ Use for employee profiles |
| `rez-wallet-service` | 4002 | REZ Wallet | ✅ Use for benefit wallets |
| `rez-payment-service` | 4001 | Payments | 🔄 Use for reimbursements |
| `rez-cashback-service` | - | Cashback | ✅ Use for rewards cashback |
| `rez-gamification-service` | - | Gamification | ✅ Use for points/badges |
| `rez-notifications-service` | 4004 | Push/Email | ✅ Use for alerts |
| `rez-referral-service` | 4007 | Referrals | ✅ Use for employee referrals |
| `rez-rewards-service` | 4008 | Rewards | ✅ Use for reward redemption |
| `rez-coupon-service` | 4009 | Coupons | ✅ Use for benefit coupons |

### REZ-Media Services

| Service | Port | Use Case | CorpPerks Integration |
|---------|------|----------|----------------------|
| `karma-service` | - | Karma scores | ✅ Use for candidate trust |
| `rez-karma-api` | - | Karma API | ✅ Use for Karma matching |
| `karma-mobile` | - | Karma app | Reference for UX |
| `karma` | - | Karma dashboard | Reference for design |

### REZ-Intelligence Services

| Service | Port | Use Case | CorpPerks Integration |
|---------|------|----------|----------------------|
| Intent Predictor | 4018 | Job matching | ✅ Use for candidate matching |
| Predictive Engine | 4059 | Attrition, burnout | ✅ Use for retention |
| Insights Service | 3011 | Analytics | ✅ Use for workforce insights |
| RFM Service | 4055 | Customer segments | 🔄 Future use |

---

## Integration Plan

### Phase 1 - Connect Available Services

```
CorpPerks Apps
    │
    ├─► rez-auth-service ─── Employee Login/OTP
    ├─► rez-profile-service ─── Employee Profiles
    ├─► rez-wallet-service ─── Benefit Wallets
    ├─► karma-service ─── Trust Scores
    ├─► rez-notifications ─── Push/Email
    └─► rez-gamification ─── Points/Badges
```

### Phase 2 - Future Integrations

```
    │
    ├─► rez-rewards-service ─── Reward Redemption
    ├─► rez-coupon-service ─── Benefit Coupons
    ├─► Intent Predictor ─── AI Matching
    └─► Predictive Engine ─── Retention AI
```

---

## Service Connection Code

### Auth Service

```typescript
// Already built in src/services/auth.ts
const AUTH_SERVICE_URL = 'https://rez-auth-service.onrender.com';
```

### Wallet Service (REZ Wallet)

```typescript
// src/services/wallet.ts
const WALLET_API = process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com';

export async function getWalletBalance(userId: string) {
  const res = await fetch(`${WALLET_API}/api/wallets/${userId}`);
  return res.json();
}
```

### Gamification Service (REZ Points)

```typescript
// src/services/gamification.ts
export async function awardPoints(userId: string, points: number) {
  const res = await fetch('https://rez-gamification-service.onrender.com/api/award', {
    method: 'POST',
    body: JSON.stringify({ userId, points }),
  });
  return res.json();
}
```

### Karma Service

```typescript
// src/services/karma.ts
// Already built - connects to karma.onrender.com
```

---

## What NOT to Build

Since REZ already has:

| Don't Build | Use Instead |
|-------------|-------------|
| Auth system | `rez-auth-service` |
| Wallet system | `rez-wallet-service` |
| Rewards | `rez-rewards-service` |
| Notifications | `rez-notifications-service` |
| Karma/Trust | `karma-service` |
| Gamification | `rez-gamification-service` |
| Payments | `rez-payment-service` |

**Focus on:** HR UI, Workforce OS, Benefits Hub, Geo-Attendance

---

## Benefits Marketplace - Merchant Integration

### Available Merchants (from REZ ecosystem)

- **Food:** Swiggy, Zomato
- **Travel:** Via, redBus
- **Wellness:** Cult.fit, FitIndia
- **Learning:** Coursera, Udemy

### Integration Points

```typescript
// Benefits marketplace connects to REZ merchant network
const MERCHANT_API = 'https://rez-merchant-api.rezapp.com';

// Use nextaBizz for B2B procurement of benefits
const NEXTABIZZ_API = '...';
```

---

## Summary

**Reuseable Services:** 10+
**Focus Areas:** HR UI, Workforce OS, Benefits Hub

**Key Integrations:**
1. Auth → Employee login
2. Wallet → Benefit wallets
3. Karma → Candidate trust
4. Gamification → Points/badges
5. Notifications → Push alerts

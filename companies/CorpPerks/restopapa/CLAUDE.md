# ReStopapa - CLAUDE.md

> **IMPORTANT:** This is ReStopapa, NOT RestoPapa.
>
> **Names:** Restaurian → RestoPapa → **ReStopapa** (current)
>
> This project was previously called "Restaurian" and "RestoPapa". It is now unified under the name **ReStopapa**.

---

## Product Identity

**Name:** ReStopapa
**Type:** B2B Restaurant Platform
**GitHub:** https://github.com/imrejaul007/ReStopapa
**Formerly Known As:** Restaurian, RestoPapa

---

## Product Relationships

```
CorpPerks (Employee Benefits)
    │
    └──► nextaBizz (B2B Procurement)
              ▲
              │ webhooks
              │
        ReStopapa (B2B Restaurant)
```

- **ReStopapa** sends inventory signals to **nextaBizz**
- **CorpPerks** connects to **nextaBizz** for procurement
- **ReZ Merchant** provides SSO for **ReStopapa**

---

## DO NOT CONFUSE

| Product | What It Is | Where |
|--------|-----------|-------|
| **ReStopapa** | This repo - B2B restaurant platform | `ReStopapa/` |
| **RestoPapa** | Old name for this repo | Same as ReStopapa |
| **Restaurian** | Oldest name for this repo | Same as ReStopapa |
| **nextaBizz** | Separate repo - B2B procurement | `nextabizz/` |
| **CorpPerks** | Parent company repo - employee benefits | `CorpPerks/` |

---

## Working with this Repo

### Clone
```bash
git clone https://github.com/imrejaul007/ReStopapa.git
cd ReStopapa
```

### Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Environment Variables
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

### Run Development
```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev
```

---

## Architecture

```
ReStopapa/
├── backend/           # NestJS API
│   └── src/
│       ├── auth/     # JWT + SSO
│       ├── restaurants/
│       ├── employees/
│       ├── jobs/
│       ├── vendors/
│       ├── marketplace/
│       ├── payments/    # Razorpay
│       ├── integrations/
│       │   └── nextabizz-webhook.service.ts  # Sends to nextaBizz
│       └── webhooks/   # Receives webhooks
│
└── frontend/         # Next.js
    └── app/          # Pages
```

---

## Integration with nextaBizz

ReStopapa acts as a **source** for inventory data that flows to nextaBizz:

### Outbound Webhooks (ReStopapa → nextaBizz)

| Event | Description |
|-------|-------------|
| `inventory.low_stock` | Stock below threshold |
| `inventory.out_of_stock` | No stock |
| `inventory.stock_updated` | Stock changed |
| `order.status_changed` | Order status update |

### nextaBizz Endpoints

- **Webhook URL:** `https://api.nextabizz.com/webhooks/restopapa`
- **Webhook Secret:** HMAC-SHA256 signature

---

## Security Rules

- **NEVER** commit `.env` files or secrets
- **ALWAYS** validate amounts server-side
- **USE** timing-safe comparisons for signatures
- **ADD** idempotency keys to payment operations

---

## Related Documentation

| Doc | Purpose |
|-----|---------|
| `README.md` | Project overview |
| `RESTOPAPA_AUDIT.md` | Security audit |
| `DEPLOYMENT.md` | Deployment guide |

---

## Git Workflow

1. Create branch: `git checkout -b feature/your-feature`
2. Make changes
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/your-feature`
5. Create PR on GitHub

---

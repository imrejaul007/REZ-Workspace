# CorpPerks - Quick Reference Card

**For: Developer**

---

## Services

| Service | Port | Health |
|---------|------|--------|
| rez-corpperks-service | 4013 | /health |
| rez-hotel-service | 4015 | /health |
| rez-procurement-service | 4012 | /health |

---

## Common Operations

### Check employee wallets
```
GET /api/wallet/combined/:employeeId
```

### Check benefits before purchase
```
POST /api/benefits-config/resolve
```

### Allocate to employee
```
POST /api/wallet/employee-corporate/:employeeId/allocate
```

### Spend from wallet
```
POST /api/wallet/employee-corporate/:employeeId/spend
```

### Bulk allocate
```
POST /api/wallet/bulk-allocate
```

---

## Dual Wallet

| Wallet | Source | Benefits |
|--------|--------|---------|
| Personal | Employee tops up | 2% cashback |
| Corporate | Company allocates | 10% discount + 5% cashback |

---

## Benefits Priority

```
Merchant > Company > Platform
```

---

## Categories

- meal (food, dining)
- travel (hotel, cab)
- wellness (gym, health)
- gift (shopping)

---

## Health Check

```bash
curl localhost:4013/health
```

---

## Deploy

```bash
docker-compose up -d
```

---

## Env Vars Required

- MONGODB_URI
- CORS_ORIGIN
- STAYOWN_API_KEY (for hotel)
- NEXTABIZZ_API_KEY (for procurement)

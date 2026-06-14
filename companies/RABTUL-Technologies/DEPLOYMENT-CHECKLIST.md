# RABTUL-Technologies Deployment Checklist

**Status:** Ready to Deploy  
**Date:** 2026-05-13

---

## Services Ready for Deployment (19)

### Core Services (8)
- [ ] rez-auth-service
- [ ] rez-wallet-service
- [ ] rez-payment-service
- [ ] rez-order-service
- [ ] rez-catalog-service
- [ ] rez-search-service
- [ ] rez-profile-service
- [ ] rez-booking-service

### Business Services (6)
- [ ] rez-articles-service ← NEW
- [ ] rez-bill-payments-service ← NEW
- [ ] rez-cashback-service ← NEW
- [ ] rez-gamification-service ← NEW
- [ ] rez-creator-earnings-service ← NEW
- [ ] rez-delivery-service

### Infrastructure Services (5)
- [ ] rez-notifications-service
- [ ] rez-analytics-service
- [ ] rez-audit-service
- [ ] rez-scheduler-service
- [ ] rez-contracts

---

## Deployment Steps

### Step 1: Deploy Core Services First

Deploy in this order (dependencies matter):

1. **rez-auth-service** (4001)
   - Portal: https://dashboard.render.com
   - Connects to: MongoDB

2. **rez-wallet-service** (4002)
   - Portal: https://dashboard.render.com
   - Connects to: MongoDB, Redis

3. **rez-payment-service** (4003)
   - Portal: https://dashboard.render.com
   - Needs: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

4. **rez-order-service** (4004)
   - Portal: https://dashboard.render.com
   - Connects to: MongoDB

5. **rez-catalog-service** (4005)
   - Portal: https://dashboard.render.com

6. **rez-search-service** (4006)
   - Portal: https://dashboard.render.com

7. **rez-profile-service** (4007)
   - Portal: https://dashboard.render.com

8. **rez-booking-service** (4008)
   - Portal: https://dashboard.render.com

### Step 2: Deploy Business Services

9. **rez-articles-service** (4010) ← NEW
10. **rez-bill-payments-service** (4030) ← NEW
11. **rez-cashback-service** (4040) ← NEW
12. **rez-gamification-service** (4050) ← NEW
13. **rez-creator-earnings-service** (4060) ← NEW
14. **rez-delivery-service** (4009)

### Step 3: Deploy Infrastructure

15. **rez-notifications-service**
16. **rez-analytics-service**
17. **rez-audit-service**
18. **rez-scheduler-service**
19. **rez-contracts**

### Step 4: Deploy API Gateway LAST

20. **api-gateway**
    - Portal: https://dashboard.render.com
    - Needs: All service URLs, INTERNAL_SERVICE_TOKENS_JSON

---

## Environment Variables Required

### For Each Service
```bash
NODE_ENV=production
PORT=<service-port>
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
SENTRY_DSN=https://...
```

### API Gateway Specific
```bash
# Service URLs
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
PROFILE_SERVICE_URL=https://rez-profile-service.onrender.com
BOOKING_SERVICE_URL=https://rez-booking-service.onrender.com

# New Services
ARTICLES_SERVICE_URL=https://rez-articles-service.onrender.com
BILL_PAYMENTS_SERVICE_URL=https://rez-bill-payments-service.onrender.com
CASHBACK_SERVICE_URL=https://rez-cashback-service.onrender.com
GAMIFICATION_SERVICE_URL=https://rez-gamification-service.onrender.com
CREATOR_EARNINGS_SERVICE_URL=https://rez-creator-earnings-service.onrender.com

# Security
INTERNAL_SERVICE_TOKENS_JSON={"service":"token"}
JWT_SECRET=<strong-secret>
ALLOWED_ORIGINS=https://rezapp.com,https://www.rezapp.com
```

### Payment Service Specific
```bash
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
```

---

## Health Check Verification

After each deployment, verify:

```bash
# Replace with actual URL
curl https://<service-name>.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "service-name",
  "timestamp": "2026-05-13T00:00:00.000Z"
}
```

---

## Post-Deployment Checklist

- [ ] All 19 services deployed
- [ ] All health checks passing
- [ ] API Gateway deployed last
- [ ] Gateway health check: `/ready` endpoint
- [ ] Test authentication flow
- [ ] Test wallet balance
- [ ] Test product catalog
- [ ] Update consumer app .env with production URLs
- [ ] Rebuild consumer app
- [ ] Submit to App Store

---

## Estimated Cost

| Plan | Services | Cost |
|------|----------|------|
| Free | 0 | $0 |
| Starter | 10 | ~$25/mo |
| Starter | 19 | ~$47/mo |

---

## Troubleshooting

### Service Won't Start
1. Check logs in Render dashboard
2. Verify environment variables
3. Check MongoDB connection

### Health Check Failing
1. Ensure `/health` endpoint returns 200
2. Check service is listening on correct port
3. Review error logs

### Gateway 502 Errors
1. Check upstream services are healthy
2. Verify service URLs in gateway env vars
3. Check CORS configuration

---

## Need Help?

1. Check logs: https://dashboard.render.com → Service → Logs
2. Check metrics: https://dashboard.render.com → Service → Metrics
3. Contact platform team

# REZ-Consumer Go-Live Plan

**Version:** 1.0.0
**Date:** June 5, 2026
**Target:** Production Launch

---

## STATUS: READY FOR DEPLOYMENT

---

## APPS TO DEPLOY

### Web Apps (Deploy to Vercel)

| # | App | Subdomain | Status | Priority |
|---|-----|-----------|--------|----------|
| 1 | rez-now | rez-now.vercel.app | ✅ Ready | P0 |
| 2 | verify-qr-dashboard | verify-qr.vercel.app | ✅ Ready | P0 |
| 3 | go4food | go4food.vercel.app | ✅ Ready | P1 |
| 4 | REZ-assistant-ui | rez-assistant.vercel.app | ✅ Ready | P1 |
| 5 | REZ-scan-ui | rez-scan.vercel.app | ✅ Ready | P2 |
| 6 | REZ-expense-ui | rez-expense.vercel.app | ✅ Ready | P2 |
| 7 | REZ-inbox-ui | rez-inbox.vercel.app | ✅ Ready | P2 |
| 8 | REZ-nearby-ui | rez-nearby.vercel.app | ✅ Ready | P2 |

### Mobile Apps (Deploy to Expo)

| # | App | Platform | Status | Priority |
|---|-----|----------|--------|----------|
| 1 | rez-app | iOS/Android | ✅ Ready | P0 |
| 2 | do | iOS/Android | ✅ Ready | P0 |
| 3 | verify-qr-mobile | iOS/Android | ✅ Ready | P1 |
| 4 | safe-qr | iOS/Android | ✅ Ready | P1 |
| 5 | rez-driver | iOS/Android | ✅ Ready | P2 |

---

## PHASE 1: Web Apps (This Week)

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy each app
cd rez-now && vercel --prod
cd ../go4food && vercel --prod
# ... etc
```

### Step 2: Configure Domains

| App | Production Domain |
|-----|-------------------|
| rez-now | rez.now |
| verify-qr | verify.rez.money |
| go4food | go4food.rez.money |
| REZ-assistant | assistant.rez.money |
| REZ-scan | scan.rez.money |

### Step 3: Configure Environment Variables

```bash
# Vercel Dashboard > Settings > Environment Variables

# All Apps
NEXT_PUBLIC_API_URL=https://api.rez.consumer
NEXT_PUBLIC_APP_URL=https://rez.now

# rez-now specific
NEXT_PUBLIC_WALLET_URL=https://wallet.rez.money
NEXT_PUBLIC_PAYMENT_URL=https://payment.rez.money

# go4food specific
NEXT_PUBLIC_GO4FOOD_API_URL=https://go4food-api.rez.money

# verify-qr specific
NEXT_PUBLIC_VERIFY_API_URL=https://verify-qr-api.rez.money
```

---

## PHASE 2: Backend Services (This Week)

### Deploy Backend APIs

| Service | Port | Deploy To |
|---------|------|-----------|
| go4food-api | 3002 | Railway/Render |
| REZ-inbox | 3003 | Railway/Render |
| REZ-assistant | 3010 | Railway/Render |
| REZ-nearby | 3015 | Railway/Render |
| REZ-scan | 3016 | Railway/Render |
| safe-qr-service | 4001 | Railway/Render |
| verify-qr-service | 4003 | Railway/Render |

### Backend Deploy Command

```bash
# Example for Railway
railway login
cd go4food-api && railway init
railway up
```

---

## PHASE 3: Mobile Apps (Next Week)

### Deploy to Expo

```bash
# Install EAS CLI
npm i -g eas-cli

# Login
eas login

# Build for production
cd rez-app
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## PRE-LAUNCH CHECKLIST

### ✅ Code Complete
- [x] All 23 services implemented
- [x] All services documented
- [x] Tests written

### ✅ Security
- [x] Auth implemented
- [x] Rate limiting enabled
- [x] Helmet security headers
- [x] Input validation

### ⏳ Environment Variables
- [ ] Configure all API URLs
- [ ] Set up API keys
- [ ] Configure webhook URLs

### ⏳ Monitoring
- [ ] Set up Sentry
- [ ] Configure Datadog
- [ ] Set up alerts

### ⏳ Domain & SSL
- [ ] Purchase domains
- [ ] Configure DNS
- [ ] SSL certificates

### ⏳ Third-Party Services
- [ ] Razorpay (payments)
- [ ] Twilio (SMS)
- [ ] SendGrid (email)
- [ ] Mapbox (maps)

---

## LAUNCH DAY

### Morning (9 AM)
1. Deploy all web apps to Vercel
2. Verify all domains work
3. Test all API endpoints

### Afternoon (2 PM)
1. Deploy backend services
2. Configure load balancers
3. Enable monitoring

### Evening (6 PM)
1. Deploy mobile apps to stores
2. Monitor for errors
3. Celebrate! 🎉

---

## POST-LAUNCH

### Week 1
- Monitor all services 24/7
- Fix any bugs immediately
- Collect user feedback

### Week 2
- Analyze metrics
- Optimize slow endpoints
- Scale if needed

### Week 3-4
- Marketing push
- User acquisition
- Feature requests

---

## ROLLOUT PLAN

| Phase | Apps | Target Date |
|-------|------|-------------|
| Phase 1 | Web Apps | June 6, 2026 |
| Phase 2 | Backend APIs | June 7, 2026 |
| Phase 3 | Mobile (Beta) | June 10, 2026 |
| Phase 4 | Mobile (Production) | June 15, 2026 |

---

## EMERGENCY CONTACTS

| Role | Contact |
|------|---------|
| DevOps | devops@rez.consumer |
| Security | security@rez.consumer |
| On-call | oncall@rez.consumer |

---

## BUDGET ESTIMATE (Monthly)

| Service | Cost |
|---------|------|
| Vercel Pro | $20 |
| Railway (7 services) | $50 |
| Expo EAS | $25 |
| Domain names | $20 |
| Monitoring | $30 |
| **Total** | **$145/month** |

---

**Let's launch!** 🚀

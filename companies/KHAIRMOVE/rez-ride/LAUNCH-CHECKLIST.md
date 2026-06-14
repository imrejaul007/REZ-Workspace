# ReZ Ride - Launch Checklist

## What's Done ✅

### Code
- [x] Backend API (52 services, 27 routes)
- [x] User App (14 screens)
- [x] Driver App (6 screens)
- [x] All integrations (RABTUL, ReZ Intelligence, ReZ Media, CorpPerks)
- [x] Error handling & validation
- [x] Unit tests (43 passing)

### Config
- [x] TypeScript configs
- [x] .gitignore files
- [x] Docker Compose
- [x] GitHub Actions CI/CD
- [x] EAS build configs
- [x] Environment templates

---

## What's Left

### Priority 1: API Keys (Do Today)

| Service | URL | Cost |
|---------|-----|------|
| [ ] MongoDB Atlas | cloud.mongodb.com | Free tier |
| [ ] Redis Cloud | redis.com | Free tier |
| [ ] Google Maps API | console.cloud.google.com | Pay-as-you-go |
| [ ] Razorpay | dashboard.razorpay.com | Free |
| [ ] Twilio / Msg91 | twilio.com / msg91.com | Pay-as-you-go |

### Priority 2: Create .env File

```bash
cd rez-ride
cp .env.example .env
# Fill in all keys from above
```

### Priority 3: Expo Account

| Task | URL |
|------|-----|
| [ ] Sign up Expo | expo.dev |
| [ ] Create project | eas project:create |
| [ ] Login EAS CLI | eas login |

### Priority 4: App Stores (Week 1)

| Task | Time | Cost |
|------|------|------|
| [ ] Apple Developer Account | 1 day | $99/year |
| [ ] Google Play Console | 1 day | $25 one-time |
| [ ] App Store listing | 2 days | - |
| [ ] Play Store listing | 2 days | - |

### Priority 5: Create Icons (Do Today)

```bash
# Use any design tool or online converter
# Required sizes:
# - 1024x1024 (App Store)
# - 512x512 (Play Store)
# - 180x180 (iOS)
# - 192x192, 512x512 (Android)
```

### Priority 6: Cloud Infrastructure (Week 1)

| Service | Option | Cost |
|---------|--------|------|
| [ ] Backend Hosting | Render / Railway / AWS | Free-$$$ |
| [ ] CDN | Cloudflare | Free |
| [ ] Domain | GoDaddy / Namecheap | $10/year |

---

## Step-by-Step Launch

### Day 1: Get API Keys
1. Create MongoDB Atlas cluster
2. Create Redis Cloud instance
3. Get Google Maps API key
4. Create Razorpay account
5. Get Twilio/ Msg91 credentials

### Day 2: Configure Backend
```bash
cp .env.example .env
# Fill in all API keys
docker-compose up -d
```

### Day 3: Expo Setup
```bash
npm install -g eas-cli
eas login
cd apps/user-app
eas build --profile preview --platform all
```

### Day 4: App Store Setup
1. Create Apple Developer account
2. Create Google Play Console account
3. Upload builds
4. Fill app listings

### Day 5: Launch!
1. Deploy backend
2. Submit to stores
3. Go live! 🚀

---

## Estimated Costs (Monthly)

| Service | Free Tier | Paid |
|---------|-----------|------|
| MongoDB Atlas | 512MB | From $9/mo |
| Redis Cloud | 30MB | Free |
| Google Maps | $200 free | Pay-as-you-go |
| Razorpay | Free | 2% fee |
| SMS (Twilio) | - | $0.01/SMS |
| Backend hosting | Render free | From $7/mo |
| CDN | Cloudflare free | - |
| **Total** | **$0** | **~$50-100/mo** |

---

## Need Help?

| Resource | URL |
|----------|-----|
| MongoDB Docs | docs.mongodb.com |
| Expo Docs | docs.expo.dev |
| React Native | reactnative.dev |

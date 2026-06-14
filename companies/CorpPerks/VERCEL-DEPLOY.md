# Vercel Deployment Guide

## Quick Deploy

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Deploy Apps

**PeopleOS:**
```bash
cd peopleos
vercel --prod
```

**TalentAI:**
```bash
cd talentai
vercel --prod
```

**Insight Campus:**
```bash
cd insight-campus
vercel --prod
```

---

## Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

### RABTUL Services
```
REZ_AUTH_URL=https://rez-auth-service.onrender.com
REZ_PROFILE_URL=https://rez-profile-service.onrender.com
REZ_WALLET_URL=https://rez-wallet-service.onrender.com
REZ_NOTIFICATIONS_URL=https://rez-notifications-service.onrender.com
```

### REZ Intelligence
```
REZ_INTENT_URL=https://rez-intent-predictor.rezapp.com
REZ_PREDICTIVE_URL=https://rez-predictive-engine.rezapp.com
REZ_INSIGHTS_URL=https://rez-insights-service.rezapp.com
REZ_CAREER_GRAPH_URL=https://rez-career-graph.rezapp.com
```

### REZ Media
```
REZ_KARMA_URL=https://karma.onrender.com
```

### Database
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/corpperks
```

---

## GitHub Actions Auto-Deploy

Push to `main` triggers auto-deploy via `.github/workflows/ci.yml`.

### Add Secrets in GitHub:
1. Go to repo Settings → Secrets
2. Add:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID_PEOPLEOS`
   - `VERCEL_PROJECT_ID_TALENTAI`
   - `VERCEL_PROJECT_ID_INSIGHT`

---

## URLs

| App | Production URL |
|-----|-----------------|
| PeopleOS | peopleos.vercel.app |
| TalentAI | talentai.vercel.app |
| Insight Campus | insight-campus.vercel.app |

---

## Custom Domains

### PeopleOS
```
peopleos.corpperks.com
```

### TalentAI
```
talentai.corpperks.com
```

Add in Vercel Dashboard → Domains

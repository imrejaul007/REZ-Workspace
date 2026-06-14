# CorpPerks - Complete Fix & Deployment Guide

**Version:** 2.0.0
**Date:** June 12, 2026

---

## Quick Deploy Commands

### Backend (Docker)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Web Apps (Vercel)
```bash
cd peopleos && vercel --prod
cd talentai && vercel --prod
cd insight-campus && vercel --prod
```

### Mobile Apps (Expo)
```bash
cd people && eas build
cd talentai-app && eas build
cd insight-app && eas build
```

---

## Git Push
```bash
git add . && git commit -m "CorpPerks v4.0.0 - Production Ready"
git push -u origin main
```

---

## Health Checks
```bash
curl http://localhost:4700/health  # API Gateway
curl http://localhost:4006/health  # Backend
curl http://localhost:4738/health  # Payroll
```

---

## Products Ready for Deployment

| Product | Type | Status |
|---------|------|--------|
| peopleos | Web | Ready |
| talentai | Web | Ready |
| insight-campus | Web | Ready |
| people | Mobile | Ready |
| talentai-app | Mobile | Ready |
| insight-app | Mobile | Ready |
| api-gateway | Backend | Ready |
| backend | Backend | Ready |
| payroll-service | Backend | Ready |

---

*Generated June 12, 2026*
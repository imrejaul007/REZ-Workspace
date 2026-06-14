# Do App - Deployment Checklist

**Version:** 2.0.0 | **Date:** May 13, 2026

---

## Pre-Deployment Checklist

### 1. Environment Variables

#### Backend (.env)
```bash
# Copy example
cp do-backend/.env.example do-backend/.env

# Generate secrets
openssl rand -hex 32
# → Set JWT_SECRET=abc123... (64 chars)

openssl rand -hex 32
# → Set OTP_SECRET=xyz789... (64 chars)

# Set production values
NODE_ENV=production
CORS_ORIGIN=https://your-do-app.com
PORT=3000
```

#### Frontend (.env)
```bash
# Copy example
cp .env.example .env

# Set production URLs
EXPO_PUBLIC_DO_API_URL=https://do-backend.onrender.com
EXPO_PUBLIC_DO_WS_URL=wss://do-backend.onrender.com/stream
```

### 2. Secrets Verification

- [ ] `JWT_SECRET` generated and set
- [ ] `JWT_SECRET` is 32+ characters
- [ ] `OTP_SECRET` generated and set
- [ ] `OTP_SECRET` is 32+ characters
- [ ] `CORS_ORIGIN` is specific domain (not `*`)
- [ ] `NODE_ENV=production` set
- [ ] No secrets in `.env.example`

### 3. Code Review

- [ ] Security fixes reviewed and merged
- [ ] No debug code in production
- [ ] No hardcoded URLs in code
- [ ] Error messages don't leak internals

### 4. Testing

- [ ] `npm test` passes (backend)
- [ ] Auth flow tested
- [ ] WebSocket auth tested
- [ ] Wallet operations tested
- [ ] Rate limiting verified

### 5. Dependencies

```bash
# Backend
cd do-backend
npm audit  # Should show 0 vulnerabilities

# Frontend
cd ..
npm audit  # Known Expo vulnerabilities - review report
```

---

## Deployment Steps

### Backend Deployment (Render)

#### Option 1: GitHub Auto-Deploy

1. Push to GitHub
2. Connect repo to Render
3. Configure:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node
   - Node Version: 20.x

#### Option 2: Manual Deploy

```bash
cd do-backend

# Install dependencies
npm ci --production

# Set environment variables in Render dashboard
```

#### Environment Variables (Render)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (generated 64-char string) |
| `OTP_SECRET` | (generated 64-char string) |
| `CORS_ORIGIN` | `https://do.yourapp.com` |
| `PORT` | `3000` |

#### Health Check

```bash
curl https://do-backend.onrender.com/health
# Expected: {"status":"ok","version":"1.0.0"}
```

---

### Frontend Deployment (EAS)

#### 1. Configure EAS

```bash
eas credentials --platform ios
eas credentials --platform android
```

#### 2. Build

```bash
# Development build
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

#### 3. Submit to Stores

```bash
# iOS
eas submit --platform ios --latest

# Android
eas submit --platform android --latest
```

---

## Post-Deployment Verification

### Backend

- [ ] Health endpoint returns 200
- [ ] Auth OTP send works
- [ ] Auth OTP verify works
- [ ] Invalid OTP rejected properly
- [ ] WebSocket connects with valid token
- [ ] WebSocket rejects without token
- [ ] Wallet operations work
- [ ] Rate limiting works
- [ ] Logs are flowing

### Frontend

- [ ] App builds successfully
- [ ] Login flow works
- [ ] Chat sends/receives messages
- [ ] Wallet displays balance
- [ ] Push notifications work

---

## Rollback Plan

### Backend

If issues occur:
1. Revert to previous deployment in Render dashboard
2. Check `do-backend/.env` for secret changes
3. Verify `NODE_ENV=production`

### Frontend

If issues occur:
1. Previous App Store version still works
2. Users auto-update over time
3. Force update via app config if critical

---

## Monitoring

### Backend Logs to Watch

```bash
# In Render dashboard
- "WebSocket connected"
- "OTP verify requested"
- "Wallet debit requested"
- "Rate limit exceeded"
- "Authentication failed"
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error rate | >1% | >5% |
| Response time | >500ms | >2000ms |
| Auth failures | >10/min | >50/min |

---

## Security Reminders

### DO ✅

- Use environment variables for all secrets
- Rotate secrets quarterly
- Monitor failed auth attempts
- Keep dependencies updated
- Review logs daily

### DON'T ❌

- Commit `.env` files
- Log sensitive data
- Skip HTTPS in production
- Use default ports
- Disable rate limiting

---

## Contacts

| Role | Contact |
|------|---------|
| Backend Dev | (your email) |
| Security | security@rez.money |
| On-call | (pagerduty link) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | May 13, 2026 | Security fixes applied |
| 1.0.0 | May 4, 2026 | Initial release |

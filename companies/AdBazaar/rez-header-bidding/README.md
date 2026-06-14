# REZ HEADER BIDDING SERVICE

**Version:** 1.0
**Date:** May 2026

---

## WHAT IT DOES

```
Prebid.js Integration → SSP Waterfall → Optimal Revenue
```

### Features

| Feature | Description |
|---------|-------------|
| Prebid.js Config | Generate Prebid.js configuration for publishers |
| SSP Waterfall | Sequential SSP calls for optimal fill rates |
| Bid Caching | Cache bids to reduce latency |
| Header Bidding | Client-side header bidding implementation |
| Bid Optimization | Maximize revenue through waterfall optimization |

---

## APIS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/prebid/config` | GET | Get Prebid.js configuration |
| `/api/auction` | POST | Run real-time auction |
| `/api/targeting` | POST | Generate targeting parameters |
| `/api/bidders` | GET | List registered bidders |
| `/api/bidders` | POST | Register new bidder |

---

## SSP WATERFALL

Default waterfall order:

1. Google AdX
2. Pubmatic
3. Index Exchange
4. Custom SSPs

---

## INTEGRATIONS

| Service | Purpose |
|---------|---------|
| SSP Adapter | Connect to SSPs |
| Ad Decision | Ad selection and targeting |
| Analytics | Bid performance tracking |

---

## DEPLOYMENT

### Render

```
1. Connect GitHub repo
2. Add env vars
3. Deploy
```

### Environment Variables

```bash
PORT=4065
REDIS_URL=redis://...
SSP_ADAPTER_URL=http://localhost:4060
```

---

## STATUS

| Component | Status |
|-----------|--------|
| Prebid Config Generation | Built |
| Auction Engine | Built |
| SSP Integration | Built |
| Targeting | Built |
| Deployment Ready | Ready |

---

**Built for scale, designed for growth.**

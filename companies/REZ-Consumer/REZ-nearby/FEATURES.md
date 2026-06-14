# REZ-nearby - Location Discovery Features

**Status:** ✅ PRODUCTION READY
**Port:** 3014

---

## FEATURES

### Discovery

| Feature | Description | Status |
|---------|-------------|--------|
| **Nearby Places** | Location-based | ✅ |
| **Categories** | By type | ✅ |
| **Distance** | Sort by distance | ✅ |
| **Filters** | Rating, price | ✅ |

### Classifieds

| Feature | Description | Status |
|---------|-------------|--------|
| **Buy/Sell** | Local marketplace | ✅ |
| **Post Listing** | Create ad | ✅ |
| **Categories** | By type | ✅ |
| **Location** | Local focus | ✅ |

### Demand Tracking

| Feature | Description | Status |
|---------|-------------|--------|
| **Popular Searches** | Trending | ✅ |
| **What's Hot** | Demand signals | ✅ |
| **Nearby Alerts** | New listings | ✅ |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/nearby` | GET | List places |
| `/classifieds` | GET | List ads |
| `/classifieds` | POST | Create ad |

---

## TECHNICAL STACK

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB

---

**Last Updated:** June 12, 2026

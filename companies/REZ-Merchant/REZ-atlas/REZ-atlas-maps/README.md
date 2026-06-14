# REZ Atlas Maps
**Port:** 5152 | **Type:** Geospatial Intelligence

---

## Overview

Map visualization service:
- Heat maps (merchant density)
- Cluster maps (business grouping)
- Territory visualization

---

## Quick Start

```bash
npm install
npm run dev
```

---

## API Endpoints

- `GET /api/heat` - Get heat map data
- `GET /api/clusters` - Get cluster data
- `GET /api/territory/:id` - Get territory map

---

## Environment Variables

```env
PORT=5152
GOOGLE_MAPS_API_KEY=your_key
```
# Search Improvements - Synonyms + Analytics

## Day 5-7: Search Service Enhancements

### 1. Synonyms API

```typescript
// src/services/synonymsService.ts
interface SynonymRule {
  id: string;
  terms: string[];  // ["shoes", "footwear", "sneakers"]
  category?: string;
  locale?: string;
}

// CRUD endpoints
GET    /api/v1/synonyms
POST   /api/v1/synonyms
PUT    /api/v1/synonyms/:id
DELETE /api/v1/synonyms/:id
GET    /api/v1/synonyms/bulk
POST   /api/v1/synonyms/import
```

### 2. Search Analytics

```typescript
// Track searches
POST /api/v1/search/track
{
  query: "running shoes",
  userId: "user123",
  results: ["prod1", "prod2"],
  clicked: "prod1",
  filters: { category: "footwear" }
}
```

### 3. Typo Tolerance Config

```yaml
# fuzzy matching settings
typo_tolerance:
  enabled: true
  min_word_length: 4
  distance: 2
  prefix_length: 2
```

## Quick Start

```bash
# Add synonyms
curl -X POST https://rez-search-service.onrender.com/api/v1/synonyms \
  -H "X-Internal-Token: $TOKEN" \
  -d '{"terms": ["shoes", "footwear", "sneakers"]}'
```

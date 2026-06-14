# REZ Articles Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Content

---

## Overview

Content management service for articles, blogs, and knowledge base content. Provides CRUD operations, categorization, search, and content scheduling.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Articles Service                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Content Manager → Article CRUD                                     │
│  ├── Category Engine → Category management                            │
│  ├── Search Index   → Full-text search                               │
│  └── Scheduler     → Scheduled publishing                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Article
```typescript
{
  articleId: string
  title: string
  content: string
  excerpt: string
  author: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Category
```typescript
{
  categoryId: string
  name: string
  slug: string
  parentId?: string
  description?: string
}
```

---

## API Endpoints

### Articles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/articles` | Create article |
| GET | `/articles` | List articles |
| GET | `/articles/:id` | Get article |
| PUT | `/articles/:id` | Update article |
| DELETE | `/articles/:id` | Delete article |
| POST | `/articles/:id/publish` | Publish article |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List categories |
| POST | `/categories` | Create category |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/articles/search` | Search articles |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.5",
  "@sentry/node": "^7.92.0"
}
```

---

## Status

- [x] Article CRUD
- [x] Category management
- [x] Full-text search
- [x] Scheduled publishing
- [x] Author management

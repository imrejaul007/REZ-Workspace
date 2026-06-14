# Content Metadata Service

**Port:** 5073

Tagging, categorization, and metadata management for content. Supports taxonomy hierarchies, tag management, and advanced search.

## Features

- Metadata CRUD for any content type
- Hierarchical taxonomy support
- Tag management with synonyms
- Category organization
- Multi-language metadata
- SEO optimization fields
- Advanced search with filters

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/metadata | Create metadata |
| GET | /api/metadata/:contentId | Get metadata |
| PUT | /api/metadata/:contentId | Update metadata |
| DELETE | /api/metadata/:contentId | Delete metadata |
| GET | /api/metadata | Search metadata |
| POST | /api/taxonomy | Create taxonomy |
| GET | /api/taxonomy | List taxonomy |
| GET | /api/taxonomy/tree | Get taxonomy tree |
| GET | /api/taxonomy/:id | Get taxonomy |
| POST | /api/taxonomy/tags | Create tag |
| GET | /api/taxonomy/tags/list | List tags |
| POST | /api/taxonomy/categories | Create category |
| GET | /api/taxonomy/categories/list | List categories |
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Quick Start

```bash
npm install
npm run dev
curl http://localhost:5073/health
```

## License

Proprietary - AdBazaar
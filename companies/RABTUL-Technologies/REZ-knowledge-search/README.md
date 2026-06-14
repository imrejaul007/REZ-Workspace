# REZ Knowledge Search

Vector search service for knowledge layer with hybrid search capabilities.

## Quick Start

```bash
npm install
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Index document |
| POST | `/api/documents/bulk` | Bulk index |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/stats` | Get index stats |
| GET | `/api/documents/:id` | Get document by ID |
| PUT | `/api/documents/:id` | Update document |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/search?q=` | Search documents |
| POST | `/api/search` | Search documents (POST) |

## Features

- Vector embeddings (simulated, production uses OpenAI/Cohere)
- Hybrid search (vector + keyword)
- Reciprocal Rank Fusion (RRF) scoring
- Filtering by source, type, tags, category
- Highlighting
- Bulk indexing
- Real-time indexing

## License

MIT

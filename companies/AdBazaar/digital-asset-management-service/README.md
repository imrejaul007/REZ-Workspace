# Digital Asset Management Service

**Port:** 5071

Centralized DAM for all creative assets. Manages images, videos, audio, and documents with versioning, folders, and tagging support.

## Features

- Asset CRUD operations with metadata
- Version control for all assets
- Folder organization with hierarchy
- Tag management and search
- Analytics tracking (views, downloads, shares)
- Storage metrics
- Prometheus metrics endpoint

## Tech Stack

- Express.js
- MongoDB with Mongoose
- Winston logging
- Prometheus metrics
- Zod validation

## API Endpoints

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/assets | Create new asset |
| GET | /api/assets | List all assets |
| GET | /api/assets/:id | Get asset by ID |
| PUT | /api/assets/:id | Update asset |
| DELETE | /api/assets/:id | Delete asset (soft) |
| GET | /api/assets/:id/versions | Get asset versions |
| POST | /api/assets/:id/versions | Create new version |
| POST | /api/assets/:id/track | Track analytics |

### Folders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/folders | Create folder |
| GET | /api/folders | List folders |
| GET | /api/folders/:id | Get folder |
| GET | /api/folders/:id/contents | Get folder contents |
| GET | /api/folders/:id/breadcrumb | Get breadcrumb path |
| PUT | /api/folders/:id | Update folder |
| DELETE | /api/folders/:id | Delete folder |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Service health |
| GET | /metrics | Prometheus metrics |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm run build
npm start

# Health check
curl http://localhost:5071/health

# Create asset
curl -X POST http://localhost:5071/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "hero-banner.jpg",
    "type": "image",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "url": "https://storage.example.com/assets/hero-banner.jpg",
    "tags": ["banner", "homepage"],
    "createdBy": "user123",
    "updatedBy": "user123"
  }'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5071 | Service port |
| MONGODB_URI | mongodb://localhost:27017/digital-asset-management | MongoDB connection |
| NODE_ENV | development | Environment mode |
| LOG_LEVEL | info | Logging level |

## Models

### Asset

| Field | Type | Description |
|-------|------|-------------|
| assetId | String | Unique identifier |
| name | String | Asset name |
| type | Enum | image, video, audio, document, other |
| mimeType | String | MIME type |
| size | Number | Size in bytes |
| url | String | Asset URL |
| thumbnailUrl | String | Thumbnail URL |
| folderId | String | Parent folder |
| tags | Array | Tags for organization |
| metadata | Object | Type-specific metadata |
| version | Number | Current version |
| status | Enum | draft, active, archived, deleted |
| analytics | Object | Views, downloads, shares |

### Version

| Field | Type | Description |
|-------|------|-------------|
| versionId | String | Unique identifier |
| assetId | String | Parent asset |
| version | Number | Version number |
| url | String | Version URL |
| checksum | String | Content hash |
| changes | String | Change description |

### Folder

| Field | Type | Description |
|-------|------|-------------|
| folderId | String | Unique identifier |
| name | String | Folder name |
| parentId | String | Parent folder |
| path | String | Full path |
| depth | Number | Nesting level |
| assetCount | Number | Assets in folder |
| subfolderCount | Number | Subfolders count |

### Tag

| Field | Type | Description |
|-------|------|-------------|
| tagId | String | Unique identifier |
| name | String | Tag name |
| slug | String | URL-friendly slug |
| category | String | Tag category |
| count | Number | Usage count |

## License

Proprietary - AdBazaar
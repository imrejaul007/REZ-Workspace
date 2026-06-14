# Creative Studio Service

Ad creative management, templates, and asset management for AdBazaar.

## Features

- Template library with categories (native, display, video, QR, social)
- Drag-drop ad builder
- Asset management (images, videos, logos)
- Creative optimization with A/B testing
- Performance analytics

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## API Endpoints

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List templates (supports `?category=`, `?format=`, `?search=`) |
| GET | `/api/templates/:id` | Get template by ID |
| GET | `/api/templates/:id/elements` | Get template elements |

### Creatives

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creatives` | List creatives |
| GET | `/api/creatives/:id` | Get creative by ID |
| POST | `/api/creatives` | Create new creative |
| PATCH | `/api/creatives/:id` | Update creative |
| POST | `/api/creatives/:id/preview` | Generate preview |
| PATCH | `/api/creatives/:id/status` | Update status (draft/approved/rejected) |
| GET | `/api/creatives/:id/performance` | Get performance metrics |
| GET | `/api/creatives/:id/ab-test` | Get A/B test results |

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | List assets |
| POST | `/api/assets` | Upload asset |
| DELETE | `/api/assets/:id` | Delete asset |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4700` | Service port |

## Template Categories

- `native` - Native advertising formats
- `display` - Banner and display ads
- `video` - Video pre-roll and in-stream
- `qr` - QR code campaign templates
- `social` - Social media formats (Stories, Reels)

## Template Formats

- `banner` - Standard banner sizes
- `square` - Square formats
- `story` - Instagram/Facebook Stories
- `reel` - Short-form video

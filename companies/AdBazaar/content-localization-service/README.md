# Content Localization Service

**Port:** 5074

Multi-language content adaptation service. Supports translation workflows, locale management, and version control for localized content.

## Features

- Create localizations for any content
- Translation workflow (draft, review, approved, published)
- Machine translation integration ready
- Locale management (languages, regions, RTL support)
- Version control for translations
- Word count and character tracking
- Translation quality metrics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/localizations | Create localization |
| GET | /api/localizations | List localizations |
| GET | /api/localizations/:id | Get localization |
| PUT | /api/localizations/:id | Update localization |
| POST | /api/localizations/:id/translate | Add translations |
| GET | /api/localizations/:id/versions | Get version history |
| POST | /api/localizations/:id/versions | Create version |
| GET | /api/localizations/content/:contentId | Get by content ID |
| GET | /api/localizations/locales/list | List locales |
| POST | /api/localizations/locales | Create locale |
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Quick Start

```bash
npm install
npm run dev
curl http://localhost:5074/health
```

## License

Proprietary - AdBazaar